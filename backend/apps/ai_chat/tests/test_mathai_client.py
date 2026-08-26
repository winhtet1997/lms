from unittest.mock import MagicMock, patch

from django.test import TestCase

from apps.ai_chat import mathai_client


def _mock_response(status_code=200, json_data=None, ok=None):
    response = MagicMock()
    response.status_code = status_code
    response.ok = ok if ok is not None else 200 <= status_code < 300
    response.json.return_value = json_data if json_data is not None else {}
    return response


class HeadersTest(TestCase):
    @patch("apps.ai_chat.mathai_client.settings")
    def test_get_has_no_idempotency_key(self, mock_settings):
        mock_settings.MATHAI_API_KEY = "test-key"
        headers = mathai_client._headers(idempotent=False)
        self.assertNotIn("Idempotency-Key", headers)
        self.assertEqual(headers["Authorization"], "Bearer test-key")

    @patch("apps.ai_chat.mathai_client.settings")
    def test_post_gets_fresh_idempotency_key(self, mock_settings):
        mock_settings.MATHAI_API_KEY = "test-key"
        first = mathai_client._headers(idempotent=True)
        second = mathai_client._headers(idempotent=True)
        self.assertIn("Idempotency-Key", first)
        self.assertNotEqual(first["Idempotency-Key"], second["Idempotency-Key"])


class RequestTest(TestCase):
    @patch("apps.ai_chat.mathai_client.requests.request")
    def test_non_2xx_raises_mathai_error(self, mock_request):
        mock_request.return_value = _mock_response(status_code=500, json_data={"detail": "boom"})
        with self.assertRaises(mathai_client.MathAIError) as ctx:
            mathai_client._request("GET", "/subjects")
        self.assertEqual(ctx.exception.status_code, 500)

    @patch("apps.ai_chat.mathai_client.requests.request")
    def test_success_false_envelope_raises(self, mock_request):
        mock_request.return_value = _mock_response(
            status_code=200, json_data={"success": False, "message": "nope"}
        )
        with self.assertRaises(mathai_client.MathAIError):
            mathai_client._request("GET", "/subjects")

    @patch("apps.ai_chat.mathai_client.requests.request")
    def test_ok_returns_json(self, mock_request):
        mock_request.return_value = _mock_response(status_code=200, json_data={"data": []})
        result = mathai_client._request("GET", "/subjects")
        self.assertEqual(result, {"data": []})

    @patch("apps.ai_chat.mathai_client.requests.request", side_effect=Exception("network down"))
    def test_network_failure_raises_mathai_error(self, mock_request):
        import requests

        mock_request.side_effect = requests.RequestException("network down")
        with self.assertRaises(mathai_client.MathAIError):
            mathai_client._request("GET", "/subjects")


class ParsingHelpersTest(TestCase):
    def test_extract_chat_id(self):
        result = {"data": {"chat_id": "abc-123"}}
        self.assertEqual(mathai_client.extract_chat_id(result), "abc-123")

    def test_extract_chat_id_missing(self):
        self.assertIsNone(mathai_client.extract_chat_id({"data": {}}))

    def test_get_last_assistant_reply(self):
        result = {
            "data": {
                "messages": [
                    {"role": "user", "content": "hi"},
                    {"role": "assistant", "content": "first"},
                    {"role": "user", "content": "more"},
                    {"role": "assistant", "content": "second"},
                ]
            }
        }
        self.assertEqual(mathai_client.get_last_assistant_reply(result), "second")

    def test_get_last_assistant_reply_none_found(self):
        result = {"data": {"messages": [{"role": "user", "content": "hi"}]}}
        self.assertIsNone(mathai_client.get_last_assistant_reply(result))
