<?php

namespace App\Http\Controllers;

use App\Models\AdminReceipt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ReceiptController extends Controller
{
    /**
     * Display a listing of the user's receipts.
     */
    public function index(Request $request): Response
    {
        $search = $request->get('search');
        $type = $request->get('type');
        $status = $request->get('status');
        
        try {
            $receipts = AdminReceipt::query()
                ->where('user_id', Auth::id())
                ->notDeleted()
                ->with(['admin:id,email'])
                ->when($search, function ($query, $search) {
                    return $query->where('receipt_number', 'like', "%{$search}%")
                               ->orWhere('description', 'like', "%{$search}%");
                })
                ->when($type, function ($query, $type) {
                    return $query->where('type', $type);
                })
                ->when($status, function ($query, $status) {
                    return $query->where('status', $status);
                })
                ->latest()
                ->paginate(10)
                ->withQueryString();

            \Log::info('User receipts loaded', [
                'count' => $receipts->count(),
                'total' => $receipts->total(),
                'user_id' => Auth::id(),
                'raw_data' => $receipts->toArray()
            ]);

            return Inertia::render('receipts/index', [
                'receipts' => $receipts,
                'search' => $search,
                'filters' => [
                    'type' => $type,
                    'status' => $status,
                ],
            ]);
        } catch (\Exception $e) {
            // Log error and return with error message
            \Log::error('Error loading receipts: ' . $e->getMessage());
            
            return Inertia::render('receipts/index', [
                'receipts' => [
                    'data' => [],
                    'current_page' => 1,
                    'last_page' => 1,
                    'from' => 0,
                    'to' => 0,
                    'total' => 0,
                    'links' => [],
                ],
                'search' => $search,
                'filters' => [
                    'type' => $type,
                    'status' => $status,
                ],
                'error' => 'Error loading receipts. Please try again.',
            ]);
        }
    }

    /**
     * Display the specified receipt.
     */
    public function show(AdminReceipt $receipt): Response
    {
        // Ensure user can only view their own receipts
        if ($receipt->user_id !== Auth::id()) {
            abort(403, 'Unauthorized');
        }

        $receipt->load(['admin']);

        return Inertia::render('receipts/show', [
            'receipt' => $receipt,
        ]);
    }

    /**
     * View PDF for the specified receipt.
     */
    public function viewPdf(AdminReceipt $receipt)
    {
        // Ensure user can only view their own receipts
        if ($receipt->user_id !== Auth::id()) {
            abort(403, 'Unauthorized');
        }

        // Set locale from user's preference or session
        $locale = Auth::user()->locale ?? session('locale', 'en');
        app()->setLocale($locale);

        if (!$receipt->pdf_base64) {
            // Generate PDF if it doesn't exist
            $receipt->generatePdf();
        }

        $pdfContent = $receipt->getPdfContent();
        
        $userName = '';
        if ($receipt->user) {
            $name = trim($receipt->user->name ?? '');
            $surname = trim($receipt->user->surname ?? '');
            if ($name || $surname) {
                $userName = '_' . str_replace(' ', '_', trim($name . '_' . $surname, '_'));
            }
        }
        $filename = "receipt_{$receipt->receipt_number}{$userName}.pdf";
        
        return response($pdfContent, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . $filename . '"'
        ]);
    }

    /**
     * Download PDF for the specified receipt.
     */
    public function downloadPdf(AdminReceipt $receipt)
    {
        // Ensure user can only download their own receipts
        if ($receipt->user_id !== Auth::id()) {
            abort(403, 'Unauthorized');
        }

        // Set locale from user's preference or session
        $locale = Auth::user()->locale ?? session('locale', 'en');
        app()->setLocale($locale);

        if (!$receipt->pdf_base64) {
            // Generate PDF if it doesn't exist
            $receipt->generatePdf();
        }

        $pdfContent = $receipt->getPdfContent();
        
        $userName = '';
        if ($receipt->user) {
            $name = trim($receipt->user->name ?? '');
            $surname = trim($receipt->user->surname ?? '');
            if ($name || $surname) {
                $userName = '_' . str_replace(' ', '_', trim($name . '_' . $surname, '_'));
            }
        }
        $filename = "receipt_{$receipt->receipt_number}{$userName}.pdf";
        
        return response($pdfContent, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"'
        ]);
    }

    /**
     * Remove the specified receipt from user view (soft delete).
     */
    public function destroy(AdminReceipt $receipt)
    {
        // Ensure user can only delete their own receipts
        if ($receipt->user_id !== Auth::id()) {
            abort(403, 'Unauthorized');
        }

        $receipt->update(['is_deleted' => true]);

        return redirect()->route('receipts.index')
                        ->with('success', 'Receipt removed from your view successfully.');
    }
}
