<h4>Subject = Math Mentor Course</h4>
<h4>Lesson = Math Mentor Chapter</h4>

Get Subjects
```
curl -X GET "https://ai.mathmentor.com.mm/api/external/v1/subjects" \
    -H "Authorization: Bearer luluai_live_1779076977708_79809acfff7d7907a6501749" | jq .
```
Get Subject
```	
curl -X GET "https://ai.mathmentor.com.mm/api/external/v1/subjects/68b68297-be74-4400-9ff2-5081367ae37e" \
    -H "Authorization: Bearer luluai_live_1779076977708_79809acfff7d7907a6501749" | jq .
```
Create a Global Chat
```	
curl -X POST "https://ai.mathmentor.com.mm/api/external/v1/chats" \
    -H "Authorization: Bearer luluai_live_1779076977708_79809acfff7d7907a6501749" \
    -H "Content-Type: application/json" \
    -H "Idempotency-Key: $(uuidgen)" \
    -d '{
        "external_user_id": "user-312",
        "message": "Hello can you tell me about math",
        "language" : "en"
    }' | jq .
```
Create Chat for a subject
```	
curl -X POST "https://ai.mathmentor.com.mm/api/external/v1/chats" \
    -H "Authorization: Bearer luluai_live_1779076977708_79809acfff7d7907a6501749" \
    -H "Content-Type: application/json" \
    -H "Idempotency-Key: $(uuidgen)" \
    -d '{
        "subject_id": "68b68297-be74-4400-9ff2-5081367ae37e",
        "external_user_id": "user-312",
        "message": "Algebraic Expressions",
        "language" : "en"
    }' | jq .
```
Create Chat for a lesson
```	
curl -X POST "https://ai.mathmentor.com.mm/api/external/v1/chats" \
    -H "Authorization: Bearer luluai_live_1779076977708_79809acfff7d7907a6501749" \
    -H "Content-Type: application/json" \
    -H "Idempotency-Key: $(uuidgen)" \
    -d '{
        "subject_id": "68b68297-be74-4400-9ff2-5081367ae37e",
        "lesson_id": "68b68297-be74-4400-9ff2-5081367ae37e",
        "external_user_id": "user-312",
        "message": "Can you explain Fractions and Decimals?",
        "language" : "en"
    }' | jq .
```		
Get Chats
```	
curl -X GET "https://ai.mathmentor.com.mm/api/external/v1/chats" \
    -H "Authorization: Bearer luluai_live_1779076977708_79809acfff7d7907a6501749" | jq .
```

Get Chats user specific
```	
curl -X GET "https://ai.mathmentor.com.mm/api/external/v1/chats?external_user_id=user-312" \
    -H "Authorization: Bearer luluai_live_1779076977708_79809acfff7d7907a6501749" | jq .
``` 		
Get Chats subject specific
```	
curl -X GET "https://ai.mathmentor.com.mm/api/external/v1/chats?subject_id=68b68297-be74-4400-9ff2-5081367ae37e" \
    -H "Authorization: Bearer luluai_live_1779076977708_79809acfff7d7907a6501749" | jq .
```  		
Get Chats subject specific and user specific
```	
curl -X GET "https://ai.mathmentor.com.mm/api/external/v1/chats?external_user_id=user-312&subject_id=68b68297-be74-4400-9ff2-5081367ae37e" \
    -H "Authorization: Bearer luluai_live_1779076977708_79809acfff7d7907a6501749" | jq .
```
Get Chat
```	
curl -X GET "https://ai.mathmentor.com.mm/api/external/v1/chats/9f0e1381-8a59-410d-a674-4a461ae3fc41" \
    -H "Authorization: Bearer luluai_live_1779076977708_79809acfff7d7907a6501749" | jq .
```  		
Continue Chat
```	
curl -X POST "https://ai.mathmentor.com.mm/api/external/v1/chats/9f0e1381-8a59-410d-a674-4a461ae3fc41/messages" \
    -H "Authorization: Bearer luluai_live_1779076977708_79809acfff7d7907a6501749" \
    -H "Content-Type: application/json" \
    -H "Idempotency-Key: $(uuidgen)" \
    -d '{
        "message": "Now give me one more example.",
        "language": "en"
    }'
```
