<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Prism Control Token Mappings
    |--------------------------------------------------------------------------
    |
    | Configure the STS control index/value pairs your Prism installation
    | expects for non-credit tokens. These values can differ by meter profile.
    | If an index is left null, the corresponding token action will be blocked
    | until it is configured in the environment.
    |
    */
    'clear_tamper' => [
        'index' => env('TOKEN_CONTROL_CLEAR_TAMPER_INDEX'),
        'value' => env('TOKEN_CONTROL_CLEAR_TAMPER_VALUE', 1),
        'is_flag' => env('TOKEN_CONTROL_CLEAR_TAMPER_IS_FLAG', true),
    ],

    'clear_credit' => [
        'index' => env('TOKEN_CONTROL_CLEAR_CREDIT_INDEX'),
        'value' => env('TOKEN_CONTROL_CLEAR_CREDIT_VALUE', 0),
        'is_flag' => env('TOKEN_CONTROL_CLEAR_CREDIT_IS_FLAG', false),
    ],

    'set_max_overdraft' => [
        'index' => env('TOKEN_CONTROL_MAX_OVERDRAFT_INDEX'),
        'value' => env('TOKEN_CONTROL_MAX_OVERDRAFT_VALUE'),
        'is_flag' => env('TOKEN_CONTROL_MAX_OVERDRAFT_IS_FLAG', false),
    ],
];
