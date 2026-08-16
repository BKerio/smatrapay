@component('mail::message')
# Password Reset Verification

You are receiving this email because we received a password reset request for your TokenPap account.

Your verification code is:

@component('mail::panel')
# {{ $otp }}
@endcomponent

This code is valid for 10 minutes. If you did not request a password reset, no further action is required.

Thanks,<br>
{{ config('app.name') }}
@endcomponent
