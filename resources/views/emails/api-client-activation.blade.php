<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Activa tu cuenta API</title>
</head>
<body style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
    <h2>Hola, {{ $client->name }}</h2>
    <p>Gracias por registrarte. Para activar tu cuenta API, da clic en el siguiente botón:</p>
    <p style="margin: 24px 0;">
        <a href="{{ $activationUrl }}" style="display:inline-block;background:#2563eb;color:#ffffff;padding:12px 18px;text-decoration:none;border-radius:8px;">
            Activar cuenta
        </a>
    </p>
    <p>Si no solicitaste esta cuenta, puedes ignorar este correo.</p>
</body>
</html>
