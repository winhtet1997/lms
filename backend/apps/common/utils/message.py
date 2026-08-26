from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template import loader


def render_mail_template(ctx={}):
    message_body = loader.render_to_string('auth/mail_template.html', ctx)
    return message_body


def send_message(subject, to_email, text_content, mail_content):
    if getattr(settings, 'MAIL_DISABLE', False) is True:
        return
    html_content = render_mail_template({
        'subject': subject,
        'content': mail_content
    })
    msg = EmailMultiAlternatives(
        subject=subject, body=text_content,
        from_email=settings.DEFAULT_FROM_EMAIL, to=[to_email]
    )
    msg.attach_alternative(html_content, "text/html")
    msg.send()
