# AI Features Architecture & Specifications

## 1. Modular AI Architecture
The marketplace requires intelligent automation across seller operations, buyer search, inventory, customer support, and administrative analytics without vendor lock-in.

### Service Layer Design (`backend/services/ai/`)
- **Configurable Provider Adapter**: Supports Google Gemini, OpenAI, Groq, OpenRouter, or a local deterministic rule-based heuristic fallback if API keys are not supplied.
- **Provider Switching**: Controlled via `.env` (`AI_PROVIDER=gemini|openai|groq|mock`, `AI_API_KEY`).
- **Telemetry & Safety**: Every AI call passes through `backend/services/ai/aiService.js`, with input sanitization, token budgeting, timeouts, error boundary fallbacks, and usage tracking into `ai_usage_logs`.
- **Zero Hallucination Business Logic**: AI is purely consultative. AI cannot directly issue refunds, execute arbitrary SQL, mutate bank accounts, or alter inventory levels without schema validation and explicit confirmation.

---

## 2. Implemented AI Feature Modules

### Module A: Seller AI Product Listing Assistant (`/api/ai/product-assistant`)
- **Purpose**: Helps sellers draft compelling titles, SEO metadata, descriptions, category recommendations, and attribute tags from bullet points or raw photos.
- **Input**: Product name/draft, intended gender, bullet attributes, category hint.
- **Output**: JSON payload with:
  - `suggestedTitle`: Polished fashion title
  - `suggestedDescription`: High-converting clothing description with fabric/fit callouts
  - `seoTitle` & `seoDescription`
  - `suggestedCategory`
  - `tags`: Array of search tags
  - `careInstructions`: Fabric-appropriate washing/ironing guidelines
- **Safety**: Prompts forbid inventing unverified claims (e.g., GOTS certified organic) without seller explicit assertion.

### Module B: Conversational Fashion Shopping Assistant (`/api/ai/shop-assistant`)
- **Purpose**: Interactive natural language product finder in storefront chat drawer (e.g., *"Find oversized linen shirts for men under ₹1,500"*).
- **Architecture**:
  1. Intent & Filter Extraction: AI parses text into structured criteria (`{ query: 'oversized', category: 'Shirt', gender: 'Mens', fabric: 'linen', maxPrice: 1500 }`).
  2. Catalog Query: Database executes real SQL query against active in-stock listings with those criteria.
  3. Recommendation Synthesis: AI formats the curated response with genuine product cards, real prices, and direct links.
- **Zero Fake Products**: AI only recommends items that exist and are currently in stock.

### Module C: Personalized Product Recommendations (`/api/ai/recommendations`)
- **Purpose**: Personalized carousels on homepage and product details page.
- **Algorithm**: Hybrid recommendation system:
  1. Customer order history & wishlist category preference.
  2. Collaborative category/color matching.
  3. Fallback to top-selling and trending approved marketplace products.

### Module D: AI Inventory Forecasting & Stockout Predictor (`/api/ai/inventory-forecast`)
- **Purpose**: Warn sellers of impending stockouts or slow-moving fashion inventory.
- **Algorithm**:
  - Calculates sales velocity (units sold per week per variant).
  - Estimates runway: `days_of_inventory = current_stock / daily_velocity`.
  - Flags variants with runway < 14 days as `High Stockout Risk`.
  - Generates recommended reorder quantities and seasonal demand commentary.

### Module E: Super Admin AI Analytics Assistant (`/api/ai/admin-analytics`)
- **Purpose**: Natural-language operational intelligence for marketplace admins (e.g., *"Which category had the highest order volume this month?"*, *"List sellers with the highest cancellation rate"*).
- **Execution**: Controlled NL-to-Intent mapping targeting allowlisted read-only aggregate functions. Absolutely no unparameterized raw SQL execution.
