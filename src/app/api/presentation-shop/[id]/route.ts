import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { query } from "@/lib/db";

const FREE_SLIDES = 3;

function checkAdminCookie(req: NextRequest): boolean {
  const session = req.cookies.get("admin_session_shop");
  return session?.value === process.env.ADMIN_SECRET;
}

function verifyAccessCookie(req: NextRequest, presentationId: string): boolean {
  const cookie = req.cookies.get(`access_shop_${presentationId}`);
  return cookie?.value === "granted";
}

function injectPaywall(html: string, presentationId: string): string {
  const paywallScript = `
<script>
(function() {
  const FREE_SLIDES = ${FREE_SLIDES};
  const PRESENTATION_ID = "${presentationId}";
  
  // Ждём загрузки страницы
  window.addEventListener('DOMContentLoaded', function() {
    
    // Создаём paywall overlay
    const overlay = document.createElement('div');
    overlay.id = 'shop-paywall';
    overlay.innerHTML = \`
      <div style="
        position: fixed;
        inset: 0;
        background: rgba(2, 6, 16, 0.97);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        font-family: 'Inter', 'Segoe UI', sans-serif;
      ">
        <div style="
          background: #1e2029;
          border: 1px solid #2a2d3a;
          border-radius: 20px;
          padding: 48px;
          max-width: 400px;
          width: 90%;
          text-align: center;
          box-shadow: 0 25px 50px rgba(0,0,0,0.5);
        ">
          <div style="
            width: 56px; height: 56px;
            background: #12131a;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            margin: 0 auto 24px;
          ">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h2 style="font-size: 1.5rem; font-weight: 700; color: #fff; margin-bottom: 8px;">Доступ закрыт</h2>
          <p style="color: #6b7280; font-size: 0.95rem; margin-bottom: 32px; line-height: 1.6;">
            Первые ${FREE_SLIDES} слайда доступны бесплатно.<br>Введи код чтобы открыть всю презентацию.
          </p>
          <input
            id="shop-code-input"
            type="text"
            placeholder="XXXX-XXXX"
            maxlength="20"
            style="
              width: 100%;
              background: #0b0f19;
              border: 1px solid #3f3f46;
              border-radius: 10px;
              padding: 14px;
              color: #fff;
              font-size: 1.1rem;
              text-align: center;
              letter-spacing: 0.15em;
              font-family: monospace;
              margin-bottom: 12px;
              outline: none;
              box-sizing: border-box;
            "
          />
          <div id="shop-error-msg" style="color: #f87171; font-size: 0.85rem; margin-bottom: 12px; min-height: 20px;"></div>
          <button
            id="shop-submit-btn"
            style="
              width: 100%;
              background: linear-gradient(135deg, #3b82f6, #6366f1);
              color: #fff;
              border: none;
              border-radius: 10px;
              padding: 14px;
              font-size: 1rem;
              font-weight: 600;
              cursor: pointer;
              margin-bottom: 16px;
            "
          >Открыть презентацию</button>
          <div style="font-size: 0.8rem; color: #4b5563;">
            Нет кода?
            <a href="https://t.me/darya_shim" target="_blank" style="color: #6b7280; text-decoration: underline;">Telegram</a>
            ·
            <a href="https://vk.com/darya_shim" target="_blank" style="color: #6b7280; text-decoration: underline;">ВКонтакте</a>
          </div>
        </div>
      </div>
    \`;
    document.body.appendChild(overlay);
    overlay.style.display = 'none';

    // Форматирование кода при вводе
    const codeInput = document.getElementById('shop-code-input');
    codeInput.addEventListener('input', function() {
      this.value = this.value.toUpperCase();
    });

    // Отправка кода
    document.getElementById('shop-submit-btn').addEventListener('click', async function() {
      const code = codeInput.value.trim();
      if (!code) return;

      const btn = document.getElementById('shop-submit-btn');
      const errorMsg = document.getElementById('shop-error-msg');
      btn.textContent = 'Проверяем...';
      btn.disabled = true;
      errorMsg.textContent = '';

      try {
        const res = await fetch('/api/verify-code-shop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, presentationId: PRESENTATION_ID }),
        });
        const json = await res.json();

        if (res.ok && json.token) {
          // Сохраняем доступ в куки через сервер
          await fetch('/api/grant-access-shop', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: json.token, presentationId: PRESENTATION_ID }),
          });
          overlay.style.display = 'none';
        } else {
          errorMsg.textContent = json.error || 'Неверный код';
          btn.textContent = 'Открыть презентацию';
          btn.disabled = false;
        }
      } catch {
        errorMsg.textContent = 'Ошибка соединения';
        btn.textContent = 'Открыть презентацию';
        btn.disabled = false;
      }
    });

    // Перехватываем навигацию по слайдам
        let slideCount = 0;

        function setupPaywall() {
          const nextBtn = document.getElementById('nextBtn');
          if (nextBtn) {
            nextBtn.addEventListener('click', function(e) {
              if (slideCount >= FREE_SLIDES) {
                e.stopImmediatePropagation();
                e.preventDefault();
                overlay.style.display = 'flex';
                return;
              }
              slideCount++;
            }, true);
          } else {
            // Если кнопка ещё не найдена — попробуем позже
            setTimeout(setupPaywall, 100);
          }
        }

        // Перехватываем клавиатуру
        document.addEventListener('keydown', function(e) {
          if (overlay.style.display === 'flex') {
            e.stopImmediatePropagation();
            e.preventDefault();
            return;
          }
          if ((e.key === 'ArrowRight' || e.key === ' ') && slideCount >= FREE_SLIDES) {
            e.stopImmediatePropagation();
            e.preventDefault();
            overlay.style.display = 'flex';
            return;
          }
          if (e.key === 'ArrowRight' || e.key === ' ') {
            slideCount++;
          }
        }, true);

        setupPaywall();

  });
})();
</script>
`;

  // Вставляем скрипт перед закрывающим </body>
  return html.replace('</body>', paywallScript + '</body>');
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const isAdmin = checkAdminCookie(req);
  const hasAccess = verifyAccessCookie(req, id);

  try {
    const result = await query(
      `SELECT content_path FROM presentations WHERE id = $1 AND is_active = true`,
      [id]
    );

    if (result.rows.length === 0) {
      return new NextResponse("Презентация не найдена", { status: 404 });
    }

    const contentPath = result.rows[0].content_path;

    if (contentPath === "demo") {
      return new NextResponse(`<html><body style="background:#0a0a0a;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;"><div style="text-align:center"><h1>🎉 Доступ открыт!</h1><p style="color:#71717a">Здесь будет настоящая презентация</p></div></body></html>`, {
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
      });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase env vars:", { supabaseUrl: !!supabaseUrl, supabaseKey: !!supabaseKey });
      return new NextResponse("Ошибка конфигурации сервера", { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase.storage
      .from("presentations")
      .download(contentPath);

    if (error || !data) {
      return new NextResponse("Файл не найден", { status: 404 });
    }

    let html = await data.text();

    // Если не админ и нет доступа — добавляем paywall
    if (!isAdmin && !hasAccess) {
      html = injectPaywall(html, id);
    }

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });

  } catch (error) {
    console.error("presentation-shop error:", error);
    return new NextResponse("Внутренняя ошибка", { status: 500 });
  }
}