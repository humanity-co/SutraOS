use axum::{
    extract::{Path, Query, Request},
    http::{StatusCode, Method},
    middleware::{self},
    response::{IntoResponse, Json},
    routing::{get, post, put},
    Router,
};
use serde_json::{json, Value};
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod db;
mod middleware;
mod models;

use middleware::auth::authenticate_token;
use middleware::signature::verify_payload_signature;
use db::query_secure;

#[tokio::main]
async fn main() {
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "info".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
        .allow_headers(Any);

    let protected_routes = Router::new()
        // Exam Module
        .route("/api/v1/exams/submit-answer", post(dummy_success).route_layer(middleware::from_fn(verify_payload_signature)))
        .route("/api/v1/exams/marks", put(dummy_success))
        .route("/api/v1/exams/calculate-relative-grades", post(dummy_success))
        .route("/api/v1/exams/freeze-grades", post(dummy_success))
        
        // Finance Module
        .route("/api/v1/finance/post-journal", post(dummy_success))
        .route("/api/v1/finance/student/:student_id/balance", get(finance_balance))
        .route("/api/v1/finance/student/:student_id/invoice", post(dummy_success))
        .route("/api/v1/finance/student/:student_id/pay", post(dummy_success))

        // Timetable Module
        .route("/api/v1/timetable/validate", post(dummy_success))
        .route("/api/v1/timetable/schedule", post(dummy_success))

        // Data Module
        .route("/api/v1/students", get(list_students))
        .route("/api/v1/students/:id", get(dummy_success))

        // Registration & Attendance
        .route("/api/v1/attendance/student/:student_id/summary", get(dummy_success))
        
        .route_layer(middleware::from_fn(authenticate_token));

    let public_routes = Router::new()
        .route("/api/v1/auth/login", post(login_handler))
        .route("/", get(|| async { "SutraOS Rust Gateway is running." }));

    let app = Router::new()
        .merge(public_routes)
        .merge(protected_routes)
        .layer(cors)
        .layer(TraceLayer::new_for_http());

    let addr = SocketAddr::from(([0, 0, 0, 0], 4000));
    tracing::info!("SutraOS Rust Gateway listening on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn login_handler(Json(payload): Json<Value>) -> impl IntoResponse {
    let username = payload.get("username").and_then(|v| v.as_str()).unwrap_or("");
    let password = payload.get("password").and_then(|v| v.as_str()).unwrap_or("");

    if username.is_empty() || password.is_empty() {
        return (StatusCode::BAD_REQUEST, Json(json!({"error": "Username and password are required"})));
    }

    let result = query_secure("SELECT u.username FROM user_accounts u WHERE u.username = $1", vec![username.to_string()]).await.unwrap();
    let rows = result.get("rows").unwrap().as_array().unwrap();

    if rows.is_empty() {
        return (StatusCode::UNAUTHORIZED, Json(json!({"error": "Invalid username or password"})));
    }

    let user = &rows[0];
    
    let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "SUTRAOS_SUPER_SECURE_JWT_SECRET_KEY_999".to_string());
    
    use jsonwebtoken::{encode, EncodingKey, Header};
    let claims = middleware::auth::Claims {
        user_id: user.get("user_id").unwrap().as_str().unwrap().to_string(),
        tenant_id: user.get("tenant_id").unwrap().as_str().unwrap().to_string(),
        username: user.get("username").unwrap().as_str().unwrap().to_string(),
        role: user.get("system_role").unwrap().as_str().unwrap().to_string(),
        department_code: "NONE".to_string(),
        scopes: vec!["sutraos:student:self".to_string()], // Hardcoded scopes for now
        exp: (std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs() as usize) + 3600,
    };

    let token = encode(&Header::default(), &claims, &EncodingKey::from_secret(secret.as_bytes())).unwrap();

    (StatusCode::OK, Json(json!({
        "message": "Login successful",
        "token": token,
        "user": user,
        "profile": {
            "firstName": user.get("first_name").unwrap().as_str().unwrap().to_string(),
            "lastName": user.get("last_name").unwrap().as_str().unwrap().to_string(),
            "role": user.get("system_role").unwrap().as_str().unwrap().to_string(),
        }
    })))
}

async fn dummy_success() -> impl IntoResponse {
    (StatusCode::OK, Json(json!({"status": "SUCCESS", "message": "Operation completed via Rust API."})))
}

async fn finance_balance(Path(student_id): Path<String>) -> impl IntoResponse {
    (StatusCode::OK, Json(json!({
        "student_id": student_id,
        "outstanding_balance": 0.00,
        "financial_exam_blocked": false,
        "cleared": true
    })))
}

async fn list_students() -> impl IntoResponse {
    let result = query_secure("SELECT u.username FROM user_accounts u", vec![]).await.unwrap();
    (StatusCode::OK, Json(json!({
        "total": 0,
        "department_filter": "ALL",
        "students": []
    })))
}
