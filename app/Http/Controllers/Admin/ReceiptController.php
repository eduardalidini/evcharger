<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminReceipt;
use App\Models\UserReceipt;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ReceiptController extends Controller
{
    /**
     * Display a listing of receipts.
     */
    public function index(Request $request): Response
    {
        $search = $request->get('search');
        $type = $request->get('type');
        $status = $request->get('status');
        
        try {
            $receipts = AdminReceipt::query()
                ->notDeleted()
                ->with(['user:id,name,surname,email', 'admin:id,email'])
                ->when($search, function ($query, $search) {
                    return $query->where('receipt_number', 'like', "%{$search}%")
                               ->orWhere('description', 'like', "%{$search}%")
                               ->orWhereHas('user', function ($userQuery) use ($search) {
                                   $userQuery->where('name', 'like', "%{$search}%")
                                            ->orWhere('surname', 'like', "%{$search}%")
                                            ->orWhere('email', 'like', "%{$search}%");
                               });
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

            \Log::info('Admin receipts loaded', [
                'count' => $receipts->count(),
                'total' => $receipts->total(),
                'search' => $search,
                'type' => $type,
                'status' => $status,
                'raw_data' => $receipts->toArray()
            ]);

            return Inertia::render('admin/receipts/index', [
                'receipts' => $receipts,
                'search' => $search,
                'filters' => [
                    'type' => $type,
                    'status' => $status,
                ],
            ]);
        } catch (\Exception $e) {
            \Log::error('Error loading admin receipts: ' . $e->getMessage());
            
            return Inertia::render('admin/receipts/index', [
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
     * Show the form for creating a new receipt.
     */
    public function create(): Response
    {
        try {
            $users = User::select('id', 'name', 'surname', 'email')->get();

            \Log::info('Admin receipt create page accessed', ['users_count' => $users->count()]);

            return Inertia::render('admin/receipts/create', [
                'users' => $users,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error loading receipt create page: ' . $e->getMessage());
            
            return redirect()->route('admin.receipts.index')
                ->with('error', 'Unable to load create page. Please try again.');
        }
    }

    /**
     * Store a newly created receipt.
     */
    public function store(Request $request)
    {
        try {
            \Log::info('Receipt store attempt', [
                'request_data' => $request->all(),
                'admin_id' => Auth::guard('admin')->id()
            ]);

            $validated = $request->validate([
                'user_id' => 'required|exists:users,id',
                'type' => 'required|in:receipt,invoice',
                // Business Information
                'business_name' => 'nullable|string|max:255',
                'business_number' => 'nullable|string|max:255',
                'business_vat' => 'nullable|string|max:255',
                'business_address' => 'nullable|string',
                // Basic amounts - amount is now nullable since it can be calculated
                'amount' => 'nullable|numeric|min:0',
                'currency' => 'required|string|size:3',
                'description' => 'nullable|string',
                'tax_amount' => 'nullable|numeric|min:0',
                // EV Charging Specific Fields
                'charging_duration_minutes' => 'nullable|integer|min:1',
                'vehicle_registration' => 'nullable|string|max:50',
                'vehicle_model' => 'nullable|string|max:100',
                'charger_type' => 'nullable|string|max:50',
                'rate_per_kwh' => 'nullable|numeric|min:0',
                'kwh_consumed' => 'nullable|numeric|min:0',
                'tax_rate_percentage' => 'nullable|numeric|min:0|max:100',
                // Payment and status
                'payment_method' => 'nullable|string',
                'payment_reference' => 'nullable|string',
                'status' => 'required|in:draft,sent,paid,overdue,cancelled',
                'issued_at' => 'nullable|date',
                'due_date' => 'nullable|date|after_or_equal:issued_at',
                'notes' => 'nullable|string',
            ]);

            \Log::info('Validation passed', ['validated_data' => $validated]);

            // Auto-calculate amount if using EV charging fields
            if (empty($validated['amount']) && isset($validated['kwh_consumed']) && isset($validated['rate_per_kwh'])) {
                $validated['amount'] = round($validated['kwh_consumed'] * $validated['rate_per_kwh'], 2);
            }
            
            // Ensure amount is set - if neither manual amount nor EV charging calculation provided, set to 0
            if (empty($validated['amount'])) {
                $validated['amount'] = 0;
            }
            
            // Auto-calculate tax amount if tax rate is provided
            if (!isset($validated['tax_amount']) && isset($validated['tax_rate_percentage']) && isset($validated['amount'])) {
                $validated['tax_amount'] = round($validated['amount'] * ($validated['tax_rate_percentage'] / 100), 2);
            }
            
            // Calculate total amount
            $validated['total_amount'] = ($validated['amount'] ?? 0) + ($validated['tax_amount'] ?? 0);
            
            // Generate receipt number
            $validated['receipt_number'] = AdminReceipt::generateReceiptNumber();
            
            // Set admin_id
            $validated['admin_id'] = Auth::guard('admin')->id();
            
            // Set default business info if not provided
            if (empty($validated['business_name'])) {
                $validated['business_name'] = 'EV Charging Station';
            }
            
            // Set issued_at if not provided and status is not draft
            if (!isset($validated['issued_at']) && $validated['status'] !== 'draft') {
                $validated['issued_at'] = now();
            }

            \Log::info('About to create receipt', ['final_data' => $validated]);

            // Create admin receipt
            $adminReceipt = AdminReceipt::create($validated);
            
            // Create user receipt with same data
            $userReceiptData = $validated;
            $userReceipt = UserReceipt::create($userReceiptData);

            \Log::info('Receipts created successfully', [
                'admin_receipt_id' => $adminReceipt->id, 
                'user_receipt_id' => $userReceipt->id,
                'receipt_number' => $adminReceipt->receipt_number
            ]);

            // Generate PDFs if not draft
            if ($adminReceipt->status !== 'draft') {
                try {
                    $adminReceipt->generatePdf();
                    $userReceipt->generatePdf();
                    \Log::info('PDFs generated', [
                        'admin_receipt_id' => $adminReceipt->id,
                        'user_receipt_id' => $userReceipt->id
                    ]);
                } catch (\Exception $pdfError) {
                    \Log::error('PDF generation failed', ['error' => $pdfError->getMessage()]);
                }
            }

            return redirect()->route('admin.receipts.index')
                            ->with('success', 'Receipt created successfully.');

        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Validation failed', ['errors' => $e->errors()]);
            return redirect()->back()
                            ->withErrors($e->errors())
                            ->withInput();
        } catch (\Exception $e) {
            \Log::error('Error creating receipt', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return redirect()->back()
                            ->with('error', 'Failed to create receipt: ' . $e->getMessage())
                            ->withInput();
        }
    }

    /**
     * Display the specified receipt.
     */
    public function show(AdminReceipt $receipt): Response
    {
        $receipt->load(['user', 'admin']);

        return Inertia::render('admin/receipts/show', [
            'receipt' => $receipt,
        ]);
    }

    /**
     * Show the form for editing the specified receipt.
     */
    public function edit(AdminReceipt $receipt): Response
    {
        $users = User::select('id', 'name', 'surname', 'email')->get();
        $receipt->load(['user', 'admin']);

        return Inertia::render('admin/receipts/edit', [
            'receipt' => $receipt,
            'users' => $users,
        ]);
    }

    /**
     * Update the specified receipt.
     */
    public function update(Request $request, AdminReceipt $receipt)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'type' => 'required|in:receipt,invoice',
            // Business Information
            'business_name' => 'nullable|string|max:255',
            'business_number' => 'nullable|string|max:255',
            'business_vat' => 'nullable|string|max:255',
            'business_address' => 'nullable|string',
            // Basic amounts - amount is now nullable since it can be calculated
            'amount' => 'nullable|numeric|min:0',
            'currency' => 'required|string|size:3',
            'description' => 'nullable|string',
            'tax_amount' => 'nullable|numeric|min:0',
            // EV Charging Specific Fields
            'charging_duration_minutes' => 'nullable|integer|min:1',
            'vehicle_registration' => 'nullable|string|max:50',
            'vehicle_model' => 'nullable|string|max:100',
            'charger_type' => 'nullable|string|max:50',
            'rate_per_kwh' => 'nullable|numeric|min:0',
            'kwh_consumed' => 'nullable|numeric|min:0',
            'tax_rate_percentage' => 'nullable|numeric|min:0|max:100',
            // Payment and status
            'payment_method' => 'nullable|string',
            'payment_reference' => 'nullable|string',
            'status' => 'required|in:draft,sent,paid,overdue,cancelled',
            'issued_at' => 'nullable|date',
            'due_date' => 'nullable|date|after_or_equal:issued_at',
            'notes' => 'nullable|string',
        ]);

        // Auto-calculate amount if using EV charging fields
        if (empty($validated['amount']) && isset($validated['kwh_consumed']) && isset($validated['rate_per_kwh'])) {
            $validated['amount'] = round($validated['kwh_consumed'] * $validated['rate_per_kwh'], 2);
        }
        
        // Ensure amount is set - if neither manual amount nor EV charging calculation provided, set to 0
        if (empty($validated['amount'])) {
            $validated['amount'] = 0;
        }
        
        // Auto-calculate tax amount if tax rate is provided
        if (!$validated['tax_amount'] && $validated['tax_rate_percentage'] && $validated['amount']) {
            $validated['tax_amount'] = round($validated['amount'] * ($validated['tax_rate_percentage'] / 100), 2);
        }
        
        // Calculate total amount
        $validated['total_amount'] = ($validated['amount'] ?? 0) + ($validated['tax_amount'] ?? 0);
        
        // Set issued_at if not provided and status is not draft
        if (!$validated['issued_at'] && $validated['status'] !== 'draft') {
            $validated['issued_at'] = now();
        }

        $receipt->update($validated);

        // Regenerate PDF if status changed or content updated
        if ($receipt->status !== 'draft') {
            $receipt->generatePdf();
        }

        return redirect()->route('admin.receipts.index')
                        ->with('success', 'Receipt updated successfully.');
    }

    /**
     * Generate PDF for the specified receipt.
     */
    public function generatePdf(AdminReceipt $receipt)
    {
        $receipt->generatePdf();

        return redirect()->route('admin.receipts.show', $receipt)
                        ->with('success', 'PDF generated successfully.');
    }

    /**
     * View PDF for the specified receipt.
     */
    public function viewPdf(AdminReceipt $receipt)
    {
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
     * Remove the specified receipt from admin view (soft delete).
     */
    public function destroy(AdminReceipt $receipt)
    {
        $receipt->update(['is_deleted' => true]);

        return redirect()->route('admin.receipts.index')
                        ->with('success', 'Receipt removed from admin view successfully.');
    }
}
