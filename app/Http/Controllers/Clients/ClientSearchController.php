<?php

namespace App\Http\Controllers\Clients;

use App\Http\Controllers\Controller;
use App\Models\Client;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClientSearchController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $agentId = (string) auth()->user()->agent_id;
        $query = trim((string) $request->string('query'));
        $queryLower = mb_strtolower($query);

        $clients = Client::query()
            ->where('agent_id', $agentId)
            ->when(mb_strlen($query) >= 3, function ($builder) use ($query) {
                $builder->where(function ($inner) use ($query) {
                   $inner->whereRaw('LOWER(first_name) LIKE ?', ["%{$query}%"])
                        ->orWhereRaw('LOWER(middle_name) LIKE ?', ["%{$query}%"])
                        ->orWhereRaw('LOWER(last_name) LIKE ?', ["%{$query}%"])
                        ->orWhereRaw('LOWER(second_last_name) LIKE ?', ["%{$query}%"])
                        ->orWhereRaw('LOWER(email) LIKE ?', ["%{$query}%"])
                        ->orWhereRaw('LOWER(phone) LIKE ?', ["%{$query}%"]);
                });
            })
            ->when(mb_strlen($query) < 3, fn ($builder) => $builder->whereRaw('1 = 0'))
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->limit(15)
            ->get([
                'id',
                'first_name',
                'middle_name',
                'last_name',
                'second_last_name',
                'phone',
                'email',
                'rfc'
            ])
            ->map(function (Client $client) {

                $subtitleParts = array_filter([
                    $client->phone,
                    $client->email
                ]);

                return [
                    'id' => $client->id,
                    'label' => $client->full_name,
                     'subtitle' => $subtitleParts
                        ? implode(' • ', $subtitleParts)
                        : 'Sin teléfono ni email',
                    'phone' => $client->phone,
                    'email' => $client->email,
                    'rfc' => $client->rfc,
                    'first_name' => $client->first_name,
                    'middle_name' => $client->middle_name,
                    'last_name' => $client->last_name,
                    'second_last_name' => $client->second_last_name,
                    'address' => $client->street,
                ];
            })
            ->values();

        return response()->json($clients);
    }
}
