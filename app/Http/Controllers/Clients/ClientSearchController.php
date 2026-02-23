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
            ->when($queryLower !== '', function ($builder) use ($queryLower) {
                $builder->where(function ($inner) use ($queryLower) {
                    $inner->whereRaw('LOWER(first_name) LIKE ?', ["%{$queryLower}%"])
                        ->orWhereRaw('LOWER(middle_name) LIKE ?', ["%{$queryLower}%"])
                        ->orWhereRaw('LOWER(last_name) LIKE ?', ["%{$queryLower}%"])
                        ->orWhereRaw('LOWER(second_last_name) LIKE ?', ["%{$queryLower}%"])
                        ->orWhereRaw('LOWER(email) LIKE ?', ["%{$queryLower}%"])
                        ->orWhereRaw('LOWER(phone) LIKE ?', ["%{$queryLower}%"]);
                });
            })
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
                    'label' => trim(implode(' ', array_filter([
                        $client->first_name,
                        $client->middle_name,
                        $client->last_name,
                        $client->second_last_name
                    ]))),
                    'subtitle' => $subtitleParts
                        ? implode(' • ', $subtitleParts)
                        : 'Sin teléfono ni email',
                    'phone' => $client->phone,
                    'email' => $client->email,
                    'rfc' => $client->rfc,
                ];
            })
            ->values();

        return response()->json($clients);
    }
}
