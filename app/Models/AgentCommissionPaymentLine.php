<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AgentCommissionPaymentLine extends Model
{
    use HasUuid;

    protected $fillable = [
        'payment_id',
        'commission_id',
        'amount_applied',
    ];

    protected $casts = [
        'amount_applied' => 'decimal:2',
    ];

    public function payment(): BelongsTo
    {
        return $this->belongsTo(AgentCommissionPayment::class, 'payment_id');
    }

    public function commission(): BelongsTo
    {
        return $this->belongsTo(AgentCommission::class, 'commission_id');
    }
}
