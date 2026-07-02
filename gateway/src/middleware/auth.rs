use axum::{
    extract::Request,
    http::{StatusCode, header},
    middleware::Next,
    response::Response,
};
use jsonwebtoken::{decode, DecodingKey, Validation, Algorithm};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub user_id: String,
    pub tenant_id: String,
    pub username: String,
    pub role: String,
    pub department_code: String,
    pub scopes: Vec<String>,
    pub exp: usize,
}

pub async fn authenticate_token(
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let auth_header = req.headers().get(header::AUTHORIZATION);
    let auth_header = match auth_header {
        Some(header) => header.to_str().map_err(|_| StatusCode::UNAUTHORIZED)?,
        None => return Err(StatusCode::UNAUTHORIZED),
    };

    if !auth_header.starts_with("Bearer ") {
        return Err(StatusCode::UNAUTHORIZED);
    }

    let token = &auth_header[7..];
    let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "SUTRAOS_SUPER_SECURE_JWT_SECRET_KEY_999".to_string());

    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_ref()),
        &Validation::new(Algorithm::HS256),
    ).map_err(|_| StatusCode::FORBIDDEN)?;

    req.extensions_mut().insert(token_data.claims);
    Ok(next.run(req).await)
}
