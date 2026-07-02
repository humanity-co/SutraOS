use axum::{
    body::Bytes,
    extract::Request,
    http::StatusCode,
    middleware::Next,
    response::Response,
};
use axum::body::Body;
use http_body_util::BodyExt;
use ring::hmac;
use std::time::{SystemTime, UNIX_EPOCH};
use crate::middleware::auth::Claims;

const TIMEOUT_WINDOW_MS: u128 = 5 * 60 * 1000;

pub async fn verify_payload_signature(
    req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let (parts, body) = req.into_parts();

    let signature = parts.headers.get("x-sutraos-signature")
        .and_then(|h| h.to_str().ok())
        .ok_or(StatusCode::BAD_REQUEST)?;

    let timestamp_str = parts.headers.get("x-sutraos-timestamp")
        .and_then(|h| h.to_str().ok())
        .ok_or(StatusCode::BAD_REQUEST)?;

    let timestamp: u128 = timestamp_str.parse().map_err(|_| StatusCode::FORBIDDEN)?;
    
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis();

    if now.abs_diff(timestamp) > TIMEOUT_WINDOW_MS {
        return Err(StatusCode::FORBIDDEN);
    }

    let user_id = parts.extensions.get::<Claims>()
        .map(|c| c.user_id.clone())
        .unwrap_or_else(|| "PUBLIC".to_string());

    let bytes = body.collect().await.map_err(|_| StatusCode::BAD_REQUEST)?.to_bytes();
    let payload_str = String::from_utf8(bytes.to_vec()).map_err(|_| StatusCode::BAD_REQUEST)?;

    let salt = std::env::var("API_SIGNING_SALT").unwrap_or_else(|_| "SUTRAOS_SIGNING_SALT_PROTECTED_888".to_string());
    let key = hmac::Key::new(hmac::HMAC_SHA256, salt.as_bytes());

    let data_to_sign = format!("{}{}{}", payload_str, timestamp_str, user_id);
    let computed_signature = hex::encode(hmac::sign(&key, data_to_sign.as_bytes()).as_ref());

    if signature != computed_signature {
        return Err(StatusCode::FORBIDDEN);
    }

    let req = Request::from_parts(parts, Body::from(bytes));
    Ok(next.run(req).await)
}
