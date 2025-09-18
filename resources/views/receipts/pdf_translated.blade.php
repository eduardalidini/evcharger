<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ ucfirst($receipt->type) }} #{{ $receipt->receipt_number }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .header {
            border-bottom: 2px solid #eee;
            margin-bottom: 30px;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #2563eb;
            margin: 0;
            font-size: 28px;
        }
        .company-info {
            margin-top: 10px;
            color: #666;
        }
        .receipt-info {
            display: table;
            width: 100%;
            margin-bottom: 30px;
        }
        .receipt-info .left,
        .receipt-info .right {
            display: table-cell;
            width: 50%;
            vertical-align: top;
        }
        .receipt-info .right {
            text-align: right;
        }
        .info-section h3 {
            color: #374151;
            margin-bottom: 10px;
            font-size: 16px;
        }
        .info-section p {
            margin: 5px 0;
            color: #666;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        .items-table th,
        .items-table td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        .items-table th {
            background-color: #f8f9fa;
            font-weight: bold;
            color: #374151;
        }
        .items-table .text-right {
            text-align: right;
        }
        .totals {
            float: right;
            width: 300px;
            margin-bottom: 30px;
        }
        .totals table {
            width: 100%;
            border-collapse: collapse;
        }
        .totals td {
            padding: 8px 12px;
            border-bottom: 1px solid #eee;
        }
        .totals .total-row {
            font-weight: bold;
            font-size: 16px;
            border-top: 2px solid #374151;
            background-color: #f8f9fa;
        }
        .footer {
            clear: both;
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 12px;
        }
        .status {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status.paid { background-color: #dcfce7; color: #166534; }
        .status.draft { background-color: #f3f4f6; color: #374151; }
        .status.sent { background-color: #dbeafe; color: #1e40af; }
        .status.overdue { background-color: #fee2e2; color: #dc2626; }
        .status.cancelled { background-color: #f3f4f6; color: #6b7280; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ ucfirst($receipt->type) }} #{{ $receipt->receipt_number }}</h1>
        <div class="company-info">
            <strong>{{ $receipt->business_name ?: 'EV Charging Station' }}</strong><br>
            @if($receipt->business_address)
                {{ $receipt->business_address }}<br>
            @endif
            @if($receipt->business_number)
                {{ $language === 'sq' ? 'Numri i Biznesit' : 'Business Number' }}: {{ $receipt->business_number }}<br>
            @endif
            @if($receipt->business_vat)
                {{ $language === 'sq' ? 'TVSH' : 'VAT' }}: {{ $receipt->business_vat }}
            @endif
        </div>
    </div>

    <div class="receipt-info">
        <div class="left">
            <div class="info-section">
                <h3>{{ $language === 'sq' ? 'Informacioni i Klientit' : 'Customer Information' }}:</h3>
                <p><strong>{{ $receipt->user->name }} {{ $receipt->user->surname }}</strong></p>
                <p>{{ $receipt->user->email }}</p>
                @if($receipt->user->phone_no)
                    <p>{{ $receipt->user->phone_no }}</p>
                @endif
                @if($receipt->user->nipt)
                    <p>NIPT: {{ $receipt->user->nipt }}</p>
                @endif
            </div>

            @if($receipt->vehicle_registration || $receipt->vehicle_model)
                <div class="info-section" style="margin-top: 20px;">
                    <h3>{{ $language === 'sq' ? 'Informacioni i Automjetit' : 'Vehicle Information' }}:</h3>
                    @if($receipt->vehicle_registration)
                        <p><strong>{{ $language === 'sq' ? 'Regjistrimi' : 'Registration' }}:</strong> {{ $receipt->vehicle_registration }}</p>
                    @endif
                    @if($receipt->vehicle_model)
                        <p><strong>{{ $language === 'sq' ? 'Modeli' : 'Model' }}:</strong> {{ $receipt->vehicle_model }}</p>
                    @endif
                </div>
            @endif
        </div>
        <div class="right">
            <div class="info-section">
                <h3>{{ ucfirst($receipt->type) }} {{ $language === 'sq' ? 'Detajet' : 'Details' }}:</h3>
                <p><strong>{{ $language === 'sq' ? 'Numri' : 'Number' }}:</strong> {{ $receipt->receipt_number }}</p>
                <p><strong>{{ $language === 'sq' ? 'Gjendja' : 'Status' }}:</strong> <span class="status {{ $receipt->status }}">{{ $language === 'sq' ? $statusTranslations[$receipt->status] : $receipt->status }}</span></p>
                @if($receipt->issued_at)
                    <p><strong>{{ $language === 'sq' ? 'Data' : 'Date' }}:</strong> {{ $receipt->issued_at->format('M d, Y') }}</p>
                    <p><strong>{{ $language === 'sq' ? 'Ora' : 'Time' }}:</strong> {{ $receipt->issued_at->format('H:i') }}</p>
                @endif
                @if($receipt->due_date)
                    <p><strong>{{ $language === 'sq' ? 'Data e Skadimit' : 'Due Date' }}:</strong> {{ $receipt->due_date->format('M d, Y') }}</p>
                @endif
            </div>

            @if($receipt->charger_type || $receipt->charging_duration_minutes || $receipt->rate_per_kwh || $receipt->kwh_consumed)
                <div class="info-section" style="margin-top: 20px;">
                    <h3>{{ $language === 'sq' ? 'Detajet e Karikimit' : 'Charging Details' }}:</h3>
                    @if($receipt->charger_type)
                        <p><strong>{{ $language === 'sq' ? 'Lloji i Karikuesit' : 'Charger Type' }}:</strong> {{ $receipt->charger_type }}</p>
                    @endif
                    @if($receipt->rate_per_kwh)
                        <p><strong>{{ $language === 'sq' ? 'Çmimi për kWh' : 'Rate Per kWh' }}:</strong> {{ $receipt->currency }} {{ number_format($receipt->rate_per_kwh, 4) }}</p>
                    @endif
                    @if($receipt->kwh_consumed)
                        <p><strong>{{ $language === 'sq' ? 'kWh e Konsumuar' : 'kWh Consumed' }}:</strong> {{ number_format($receipt->kwh_consumed, 3) }} kWh</p>
                    @endif
                    @if($receipt->charging_duration_minutes)
                        <p><strong>{{ $language === 'sq' ? 'Koha e Karikimit' : 'Charging Time' }}:</strong> {{ $receipt->formatted_charging_duration }}</p>
                    @endif
                    @if($receipt->tax_rate_percentage)
                        <p><strong>{{ $language === 'sq' ? 'Shkalla e Taksës' : 'Tax Rate' }}:</strong> {{ number_format($receipt->tax_rate_percentage, 2) }}%</p>
                    @endif
                </div>
            @endif
        </div>
    </div>

    @if($receipt->description)
        <div style="margin-bottom: 30px;">
            <h3>{{ $language === 'sq' ? 'Përshkrimi' : 'Description' }}:</h3>
            <p>{{ $receipt->description }}</p>
        </div>
    @endif

    {{-- Items --}}
    @if(isset($receipt->receipt_items) && count($receipt->receipt_items) > 0)
        <table class="items-table">
            <thead>
                <tr>
                    <th>{{ $language === 'sq' ? 'Artikull' : 'Item' }}</th>
                    <th class="text-right">{{ $language === 'sq' ? 'Sasia' : 'Quantity' }}</th>
                    <th class="text-right">{{ $language === 'sq' ? 'Çmimi për Njësi' : 'Unit Price' }}</th>
                    <th class="text-right">{{ $language === 'sq' ? 'Totali' : 'Total' }}</th>
                </tr>
            </thead>
            <tbody>
                @foreach($receipt->receipt_items as $item)
                    <tr>
                        <td>{{ $item['name'] }}</td>
                        <td class="text-right">{{ number_format($item['quantity'], 0) }}</td>
                        <td class="text-right">{{ $receipt->currency }} {{ number_format($item['unit_price'], 2) }}</td>
                        <td class="text-right">{{ $receipt->currency }} {{ number_format($item['total_price'], 2) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    @if($receipt->rate_per_kwh && $receipt->kwh_consumed)
        <table class="items-table">
            <thead>
                <tr>
                    <th>{{ $language === 'sq' ? 'Përshkrimi' : 'Description' }}</th>
                    <th class="text-right">{{ $language === 'sq' ? 'Çmimi' : 'Rate' }}</th>
                    <th class="text-right">kWh</th>
                    <th class="text-right">{{ $language === 'sq' ? 'Shuma' : 'Amount' }}</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>{{ $language === 'sq' ? 'Karikimi EV' : 'EV Charging' }}</td>
                    <td class="text-right">{{ $receipt->currency }} {{ number_format($receipt->rate_per_kwh, 4) }}</td>
                    <td class="text-right">{{ number_format($receipt->kwh_consumed, 3) }}</td>
                    <td class="text-right">{{ $receipt->currency }} {{ number_format($receipt->amount, 2) }}</td>
                </tr>
            </tbody>
        </table>
    @endif

    @if($receipt->payment_method || $receipt->payment_reference)
        <div style="margin-bottom: 30px;">
            <h3>{{ $language === 'sq' ? 'Informacioni i Pagesës' : 'Payment Information' }}:</h3>
            @if($receipt->payment_method)
                <p><strong>{{ $language === 'sq' ? 'Metoda e Pagesës' : 'Payment Method' }}:</strong> {{ $receipt->payment_method }}</p>
            @endif
            @if($receipt->payment_reference)
                <p><strong>{{ $language === 'sq' ? 'Referenca' : 'Reference' }}:</strong> {{ $receipt->payment_reference }}</p>
            @endif
        </div>
    @endif

    <div class="totals">
        <table>
            <tr>
                <td>{{ $language === 'sq' ? 'Nëntotali' : 'Subtotal' }}:</td>
                <td class="text-right">{{ $receipt->currency }} {{ number_format($receipt->amount, 2) }}</td>
            </tr>
            @if($receipt->tax_amount > 0)
                <tr>
                    <td>{{ $language === 'sq' ? 'Taksa' : 'Tax' }}:</td>
                    <td class="text-right">{{ $receipt->currency }} {{ number_format($receipt->tax_amount, 2) }}</td>
                </tr>
            @endif
            <tr class="total-row">
                <td>{{ $language === 'sq' ? 'Totali' : 'Total' }}:</td>
                <td class="text-right">{{ $receipt->currency }} {{ number_format($receipt->total_amount, 2) }}</td>
            </tr>
        </table>
    </div>

    @if($receipt->notes)
        <div style="clear: both; margin-top: 30px;">
            <h3>{{ $language === 'sq' ? 'Shënime' : 'Notes' }}:</h3>
            <p>{{ $receipt->notes }}</p>
        </div>
    @endif

    <div class="footer">
        <p><strong>{{ $language === 'sq' ? 'Faleminderit që zgjodhët energjinë e qëndrueshme!' : 'Thank you for choosing sustainable energy!' }}</strong></p>
        <p>{{ $language === 'sq' ? 'Gjeneruar më' : 'Generated on' }} {{ now()->format('M d, Y \a\t H:i') }} {{ $language === 'sq' ? 'nga Administratori' : 'by Admin' }}</p>
        <p>{{ $language === 'sq' ? 'Ky është një dokument i gjeneruar nga kompjuteri. Nuk kërkohet nënshkrim.' : 'This is a computer-generated document. No signature is required.' }}</p>
    </div>
</body>
</html>
