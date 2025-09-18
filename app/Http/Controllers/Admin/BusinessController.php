<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BusinessInfo;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BusinessController extends Controller
{
    use AuthorizesRequests;
    public function index()
    {
        $businessInfo = auth()->user()->businessInfo()->orderBy('is_default', 'desc')->get();
        
        return Inertia::render('admin/business/index', [
            'businessInfo' => $businessInfo,
        ]);
    }

    public function create()
    {
        return Inertia::render('admin/business/create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'business_name' => 'required|string|max:255',
            'business_number' => 'required|string|max:255',
            'vat_number' => 'required|string|max:255',
            'business_address' => 'required|string',
            'is_default' => 'boolean',
        ]);

        $adminId = auth()->id();
        
        // If this is set as default, remove default from others
        if ($request->is_default) {
            BusinessInfo::where('admin_id', $adminId)->update(['is_default' => false]);
        }

        // If this is the first business info, make it default
        $isFirst = BusinessInfo::where('admin_id', $adminId)->count() === 0;
        
        BusinessInfo::create([
            'admin_id' => $adminId,
            'business_name' => $request->business_name,
            'business_number' => $request->business_number,
            'vat_number' => $request->vat_number,
            'business_address' => $request->business_address,
            'is_default' => $isFirst || $request->is_default,
        ]);

        return redirect()->route('admin.business.index')->with('success', 'Business information created successfully.');
    }

    public function edit(BusinessInfo $business)
    {
        $this->authorize('update', $business);
        
        return Inertia::render('admin/business/edit', [
            'business' => $business,
        ]);
    }

    public function update(Request $request, BusinessInfo $business)
    {
        $this->authorize('update', $business);
        
        $request->validate([
            'business_name' => 'required|string|max:255',
            'business_number' => 'required|string|max:255',
            'vat_number' => 'required|string|max:255',
            'business_address' => 'required|string',
            'is_default' => 'boolean',
        ]);

        // If this is set as default, remove default from others
        if ($request->is_default) {
            BusinessInfo::where('admin_id', auth()->id())
                ->where('id', '!=', $business->id)
                ->update(['is_default' => false]);
        }

        $business->update($request->all());

        return redirect()->route('admin.business.index')->with('success', 'Business information updated successfully.');
    }

    public function destroy(BusinessInfo $business)
    {
        $this->authorize('delete', $business);
        
        // Prevent deletion if it's the only business info
        if (auth()->user()->businessInfo()->count() <= 1) {
            return redirect()->route('admin.business.index')->with('error', 'Cannot delete the only business information. You must have at least one business.');
        }

        $business->delete();

        // If deleted business was default, make another one default
        if ($business->is_default) {
            $firstBusiness = auth()->user()->businessInfo()->first();
            if ($firstBusiness) {
                $firstBusiness->update(['is_default' => true]);
            }
        }

        return redirect()->route('admin.business.index')->with('success', 'Business information deleted successfully.');
    }

    public function setDefault(BusinessInfo $business)
    {
        $this->authorize('update', $business);
        
        BusinessInfo::setDefault(auth()->id(), $business->id);

        return redirect()->route('admin.business.index')->with('success', 'Default business information updated successfully.');
    }
}
