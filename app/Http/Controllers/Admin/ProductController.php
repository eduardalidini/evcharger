<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Currency;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $products = Product::with('currency')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(function (Product $product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'description' => $product->description,
                    'sku' => $product->sku,
                    'type' => $product->type,
                    'price' => (float) $product->price,
                    'currency' => $product->currency,
                    'credit_value' => $product->credit_value ? (float) $product->credit_value : null,
                    'credit_to_currency_rate' => (float) $product->credit_to_currency_rate,
                    'is_active' => (bool) $product->is_active,
                    'is_featured' => (bool) $product->is_featured,
                    'sort_order' => $product->sort_order,
                    'track_quantity' => (bool) $product->track_quantity,
                    'quantity' => $product->quantity,
                    'min_quantity' => $product->min_quantity,
                    'max_per_user' => $product->max_per_user,
                    'max_per_transaction' => $product->max_per_transaction,
                    'image_url' => $product->image_url,
                    'metadata' => $product->metadata,
                    'created_at' => $product->created_at,
                    'updated_at' => $product->updated_at,
                ];
            });

        return Inertia::render('admin/products/index', [
            'products' => $products,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $currencies = Currency::orderBy('currency_code')->get(['id', 'currency_code']);
        
        return Inertia::render('admin/products/create', [
            'currencies' => $currencies,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'sku' => 'required|string|max:255|unique:products,sku',
            'type' => 'required|string|in:credit',
            'price' => 'required|numeric|min:0',
            'currency' => 'required|string|max:3',
            'currency_id' => 'nullable|exists:currencies,id',
            'credit_value' => 'required|numeric|min:0',
            'credit_to_currency_rate' => 'nullable|numeric|min:0',
            'is_active' => 'nullable|boolean',
            'is_featured' => 'nullable|boolean',
            'sort_order' => 'nullable|integer|min:0',
            'track_quantity' => 'nullable|boolean',
            'quantity' => 'nullable|integer|min:0',
            'min_quantity' => 'nullable|integer|min:0',
            'max_per_user' => 'nullable|integer|min:1',
            'max_per_transaction' => 'nullable|integer|min:1',
            'image_url' => 'nullable|string|url',
        ]);

        // Set defaults
        $data['is_active'] = $request->boolean('is_active', true);
        $data['is_featured'] = $request->boolean('is_featured', false);
        $data['track_quantity'] = $request->boolean('track_quantity', false);
        $data['sort_order'] = $data['sort_order'] ?? 0;
        $data['credit_to_currency_rate'] = $data['credit_to_currency_rate'] ?? 1.0;

        // Since all products are credits, credit_value is always required (handled by validation)

        Product::create($data);

        return redirect()->route('admin.products.index')->with('success', 'Product created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Product $product)
    {
        $product->load('currency');
        
        return Inertia::render('admin/products/show', [
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'description' => $product->description,
                'sku' => $product->sku,
                'type' => $product->type,
                'price' => (float) $product->price,
                'currency' => $product->currency,
                'credit_value' => $product->credit_value ? (float) $product->credit_value : null,
                'credit_to_currency_rate' => (float) $product->credit_to_currency_rate,
                'is_active' => (bool) $product->is_active,
                'is_featured' => (bool) $product->is_featured,
                'sort_order' => $product->sort_order,
                'track_quantity' => (bool) $product->track_quantity,
                'quantity' => $product->quantity,
                'min_quantity' => $product->min_quantity,
                'max_per_user' => $product->max_per_user,
                'max_per_transaction' => $product->max_per_transaction,
                'image_url' => $product->image_url,
                'metadata' => $product->metadata,
                'created_at' => $product->created_at,
                'updated_at' => $product->updated_at,
            ],
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Product $product)
    {
        $currencies = Currency::orderBy('currency_code')->get(['id', 'currency_code']);
        
        return Inertia::render('admin/products/edit', [
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'description' => $product->description,
                'sku' => $product->sku,
                'type' => $product->type,
                'price' => (float) $product->price,
                'currency' => $product->currency,
                'currency_id' => $product->currency_id,
                'credit_value' => $product->credit_value ? (float) $product->credit_value : null,
                'credit_to_currency_rate' => (float) $product->credit_to_currency_rate,
                'is_active' => (bool) $product->is_active,
                'is_featured' => (bool) $product->is_featured,
                'sort_order' => $product->sort_order,
                'track_quantity' => (bool) $product->track_quantity,
                'quantity' => $product->quantity,
                'min_quantity' => $product->min_quantity,
                'max_per_user' => $product->max_per_user,
                'max_per_transaction' => $product->max_per_transaction,
                'image_url' => $product->image_url,
                'metadata' => $product->metadata,
            ],
            'currencies' => $currencies,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Product $product)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'sku' => 'required|string|max:255|unique:products,sku,' . $product->id,
            'type' => 'required|string|in:credit',
            'price' => 'required|numeric|min:0',
            'currency' => 'required|string|max:3',
            'currency_id' => 'nullable|exists:currencies,id',
            'credit_value' => 'required|numeric|min:0',
            'credit_to_currency_rate' => 'nullable|numeric|min:0',
            'is_active' => 'nullable|boolean',
            'is_featured' => 'nullable|boolean',
            'sort_order' => 'nullable|integer|min:0',
            'track_quantity' => 'nullable|boolean',
            'quantity' => 'nullable|integer|min:0',
            'min_quantity' => 'nullable|integer|min:0',
            'max_per_user' => 'nullable|integer|min:1',
            'max_per_transaction' => 'nullable|integer|min:1',
            'image_url' => 'nullable|string|url',
        ]);

        // Set defaults
        $data['is_active'] = $request->boolean('is_active', true);
        $data['is_featured'] = $request->boolean('is_featured', false);
        $data['track_quantity'] = $request->boolean('track_quantity', false);
        $data['sort_order'] = $data['sort_order'] ?? 0;
        $data['credit_to_currency_rate'] = $data['credit_to_currency_rate'] ?? 1.0;

        // Since all products are credits, credit_value is always required (handled by validation)

        $product->update($data);

        return redirect()->route('admin.products.index')->with('success', 'Product updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Product $product)
    {
        $product->delete();
        
        return redirect()->route('admin.products.index')->with('success', 'Product deleted successfully.');
    }
}
