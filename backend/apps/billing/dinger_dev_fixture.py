"""
Canned Dinger callback payload for local development.

Used only when settings.DINGER_DEV_CALLBACK = True, so a developer without real
Dinger merchant credentials can still exercise the full checkout -> callback ->
enrollment-activation flow. Decrypts (with DINGER_CALLBACK_KEY below) to a
`{"transactionStatus": "SUCCESS", "totalAmount": ..., "transactionId": ...}`-shaped
payload; the callback view overwrites `merchantOrderId` with whichever
PaymentTransaction was created most recently before replaying this fixture.
"""

PAYMENT_RESULT = (
    "Zz54O5IDqLG/7xlvTDJAXkjLZWnAorIy1IYdZaWa7L2JXk7uv8bnU56DEmNEj/MVhP+FbHu6N8Pl1T/RLd4wOyP7/QmXhpgfP+h7mmbZGJT46vX9IjsBjMj61e1Q+/Um2SuOH2ZfQQcgcSyyd/J9b+abhoB+IKX9XPlc3ZEiWiJmrs13s/w8pJsChxx3N0P1LF8ZGaHn9eWruDa3OVMj5f7jxrT5+2+s8vykRS/+wdN75Cq/7zKe+X1NH0JOfH4ivi735FVXzDRnTMNiU9fhNPoNOm0QhYf18/xMWvhPdhbUiPIVBDrvFn6QH8oPf4JD"
)

CHECKSUM = (
    "2fefdafdf71c8c59e539c1b9325831ec04c6951d7b23f3859f5e01841c3c3a71"
)
