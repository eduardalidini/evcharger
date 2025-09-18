<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class MarketplaceController extends Controller
{
    /**
     * Show available products for the user.
     */
    public function index(Request $request): Response
    {
        $products = Product::query()->active()->credits()->ordered()->get([
            'id', 'name', 'description', 'sku', 'price', 'currency', 'credit_value', 'image_url', 'sort_order'
        ]);

        $user = $request->user();

        return Inertia::render('marketplace/index', [
            'products' => $products,
            'balance' => $user?->balance ?? 0,
        ]);
    }

    /**
     * Buy a credit product to add to user balance.
     */
    public function buyProduct(Request $request, Product $product)
    {
        $user = $request->user();

        if (!$product->is_active || !$product->isCreditProduct()) {
            return back()->withErrors(['product' => 'Product is not available.']);
        }

        // For simplicity, 1 unit per purchase
        $creditsToAdd = (float) $product->credit_value;
        $user->increment('balance', $creditsToAdd);

        return back()->with('success', 'Credits added to your balance.');
    }

    // Service-related session endpoints and helpers removed
}


