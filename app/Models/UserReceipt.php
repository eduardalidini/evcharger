<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Barryvdh\DomPDF\Facade\Pdf;

class UserReceipt extends Model
{
    use HasFactory;

    protected $table = 'user_receipts';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'receipt_number',
        'admin_id',
        'user_id',
        'type',
        'business_name',
        'business_number',
        'business_vat',
        'business_address',
        'amount',
        'currency',
        'description',
        'tax_amount',
        'total_amount',
        'charging_duration_minutes',
        'vehicle_registration',
        'vehicle_model',
        'charger_type',
        'rate_per_kwh',
        'kwh_consumed',
        'tax_rate_percentage',
        'payment_method',
        'payment_reference',
        'status',
        'issued_at',
        'due_date',
        'pdf_base64',
        'notes',
        'is_deleted',
    ];

    /**
     * The attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'rate_per_kwh' => 'decimal:4',
            'kwh_consumed' => 'decimal:3',
            'tax_rate_percentage' => 'decimal:2',
            'issued_at' => 'datetime',
            'due_date' => 'datetime',
            'is_deleted' => 'boolean',
        ];
    }

    /**
     * Get the virtual pdf_path attribute.
     */
    protected function pdfPath(): \Illuminate\Database\Eloquent\Casts\Attribute
    {
        return \Illuminate\Database\Eloquent\Casts\Attribute::make(
            get: fn () => $this->pdf_base64 ? true : null,
        );
    }

    /**
     * Get the admin that created the receipt.
     */
    public function admin(): BelongsTo
    {
        return $this->belongsTo(Admin::class);
    }

    /**
     * Get the user that owns the receipt.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Generate PDF and store as Base64.
     */
    public function generatePdf(): string
    {
        $pdf = Pdf::loadView('receipts.pdf', ['receipt' => $this]);
        $pdfContent = $pdf->output();
        $base64 = base64_encode($pdfContent);
        
        $this->update(['pdf_base64' => $base64]);
        
        return $base64;
    }

    /**
     * Get PDF as Base64.
     */
    public function getPdfBase64(): ?string
    {
        return $this->pdf_base64;
    }

    /**
     * Get PDF as downloadable content.
     */
    public function getPdfContent(): ?string
    {
        return $this->pdf_base64 ? base64_decode($this->pdf_base64) : null;
    }

    /**
     * Generate unique receipt number.
     */
    public static function generateReceiptNumber($user = null): string
    {
        if ($user) {
            $userName = $user->name . $user->surname;
            $userName = preg_replace('/[^a-zA-Z0-9]/', '', $userName); // Remove special chars
            $dateTime = now()->setTimezone('Europe/Tirane')->format('dmY_Hi'); // 12092025_1430
            
            $prefix = $userName . '_' . $dateTime . '_';
            $latest = static::where('receipt_number', 'like', $prefix . '%')
                ->latest('id')
                ->first();
            
            $number = $latest ? (int) substr($latest->receipt_number, strrpos($latest->receipt_number, '_') + 1) + 1 : 1;
            
            return $prefix . str_pad($number, 3, '0', STR_PAD_LEFT);
        } else {
            // Fallback to old format if no user provided
            $prefix = 'EVC-' . now()->format('Y') . '-';
            $latest = static::whereYear('created_at', now()->year)
                ->latest('id')
                ->first();
            
            $number = $latest ? (int) substr($latest->receipt_number, -4) + 1 : 1;
            
            return $prefix . str_pad($number, 4, '0', STR_PAD_LEFT);
        }
    }

    /**
     * Scope for non-deleted receipts.
     */
    public function scopeNotDeleted($query)
    {
        return $query->where('is_deleted', false);
    }
}