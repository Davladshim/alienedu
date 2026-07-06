module.exports=[87366,e=>e.a(async(t,n)=>{try{var o=e.i(89171),a=e.i(24389),r=e.i(43793),i=t([r]);async function s(e,{params:t}){var n;let i,l,{id:d}=await t,p=(i=e.cookies.get("admin_session_shop"),i?.value===process.env.ADMIN_SECRET),c=(l=e.cookies.get(`access_shop_${d}`),l?.value==="granted");try{let e,t=await (0,r.query)("SELECT content_path FROM presentations WHERE id = $1 AND is_active = true",[d]);if(0===t.rows.length)return new o.NextResponse("Презентация не найдена",{status:404});let i=t.rows[0].content_path;if("demo"===i)return new o.NextResponse(`<html><body style="background:#0a0a0a;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;"><div style="text-align:center"><h1>🎉 Доступ открыт!</h1><p style="color:#71717a">Здесь будет настоящая презентация</p></div></body></html>`,{headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store"}});let s=(0,a.createClient)("https://abmwzgzgqybmwrxedxla.supabase.co",process.env.SUPABASE_SERVICE_ROLE_KEY),{data:l,error:u}=await s.storage.from("presentations").download(i);if(u||!l)return new o.NextResponse("Файл не найден",{status:404});let h=await l.text();return p||c||(n=h,e=`
<script>
(function() {
  const FREE_SLIDES = 3;
  const PRESENTATION_ID = "${d}";
  
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
            Первые 3 слайда доступны бесплатно.<br>Введи код чтобы открыть всю презентацию.
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
            \xb7
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
`,h=n.replace("</body>",e+"</body>")),new o.NextResponse(h,{status:200,headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store, no-cache, must-revalidate"}})}catch(e){return console.error("presentation-shop error:",e),new o.NextResponse("Внутренняя ошибка",{status:500})}}[r]=i.then?(await i)():i,e.s(["GET",0,s]),n()}catch(e){n(e)}},!1),50868,e=>e.a(async(t,n)=>{try{var o=e.i(47909),a=e.i(74017),r=e.i(96250),i=e.i(59756),s=e.i(61916),l=e.i(74677),d=e.i(69741),p=e.i(16795),c=e.i(87718),u=e.i(95169),h=e.i(47587),f=e.i(66012),y=e.i(70101),g=e.i(26937),m=e.i(10372),v=e.i(93695);e.i(20232);var x=e.i(5232),b=e.i(87366),w=t([b]);[b]=w.then?(await w)():w;let R=new o.AppRouteRouteModule({definition:{kind:a.RouteKind.APP_ROUTE,page:"/api/presentation-shop/[id]/route",pathname:"/api/presentation-shop/[id]",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/src/app/api/presentation-shop/[id]/route.ts",nextConfigOutput:"",userland:b,...{}}),{workAsyncStorage:C,workUnitAsyncStorage:T,serverHooks:_}=R;async function E(e,t,n){n.requestMeta&&(0,i.setRequestMeta)(e,n.requestMeta),R.isDev&&(0,i.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let o="/api/presentation-shop/[id]/route";o=o.replace(/\/index$/,"")||"/";let r=await R.prepare(e,t,{srcPage:o,multiZoneDraftMode:!1});if(!r)return t.statusCode=400,t.end("Bad Request"),null==n.waitUntil||n.waitUntil.call(n,Promise.resolve()),null;let{buildId:b,deploymentId:w,params:E,nextConfig:C,parsedUrl:T,isDraftMode:_,prerenderManifest:I,routerServerContext:S,isOnDemandRevalidate:A,revalidateOnlyGenerated:N,resolvedPathname:k,clientReferenceManifest:P,serverActionsManifest:O}=r,D=(0,d.normalizeAppPath)(o),M=!!(I.dynamicRoutes[D]||I.routes[k]),q=async()=>((null==S?void 0:S.render404)?await S.render404(e,t,T,!1):t.end("This page could not be found"),null);if(M&&!_){let e=!!I.routes[k],t=I.dynamicRoutes[D];if(t&&!1===t.fallback&&!e){if(C.adapterPath)return await q();throw new v.NoFallbackError}}let H=null;!M||R.isDev||_||(H=k,H="/index"===H?"/":H);let U=!0===R.isDev||!M,j=M&&!U;O&&P&&(0,l.setManifestsSingleton)({page:o,clientReferenceManifest:P,serverActionsManifest:O});let B=e.method||"GET",L=(0,s.getTracer)(),F=L.getActiveScopeSpan(),$=!!(null==S?void 0:S.isWrappedByNextServer),z=!!(0,i.getRequestMeta)(e,"minimalMode"),X=(0,i.getRequestMeta)(e,"incrementalCache")||await R.getIncrementalCache(e,C,I,z);null==X||X.resetRequestCache(),globalThis.__incrementalCache=X;let K={params:E,previewProps:I.preview,renderOpts:{experimental:{authInterrupts:!!C.experimental.authInterrupts},cacheComponents:!!C.cacheComponents,supportsDynamicResponse:U,incrementalCache:X,cacheLifeProfiles:C.cacheLife,waitUntil:n.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,n,o,a)=>R.onRequestError(e,t,o,a,S)},sharedContext:{buildId:b,deploymentId:w}},V=new p.NodeNextRequest(e),G=new p.NodeNextResponse(t),W=c.NextRequestAdapter.fromNodeNextRequest(V,(0,c.signalFromNodeResponse)(t));try{let r,i=async e=>R.handle(W,K).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let n=L.getRootSpanAttributes();if(!n)return;if(n.get("next.span_type")!==u.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${n.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let a=n.get("next.route");if(a){let t=`${B} ${a}`;e.setAttributes({"next.route":a,"http.route":a,"next.span_name":t}),e.updateName(t),r&&r!==e&&(r.setAttribute("http.route",a),r.updateName(t))}else e.updateName(`${B} ${o}`)}),l=async r=>{var s,l;let d=async({previousCacheEntry:a})=>{try{if(!z&&A&&N&&!a)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let o=await i(r);e.fetchMetrics=K.renderOpts.fetchMetrics;let s=K.renderOpts.pendingWaitUntil;s&&n.waitUntil&&(n.waitUntil(s),s=void 0);let l=K.renderOpts.collectedTags;if(!M)return await (0,f.sendResponse)(V,G,o,K.renderOpts.pendingWaitUntil),null;{let e=await o.blob(),t=(0,y.toNodeOutgoingHttpHeaders)(o.headers);l&&(t[m.NEXT_CACHE_TAGS_HEADER]=l),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let n=void 0!==K.renderOpts.collectedRevalidate&&!(K.renderOpts.collectedRevalidate>=m.INFINITE_CACHE)&&K.renderOpts.collectedRevalidate,a=void 0===K.renderOpts.collectedExpire||K.renderOpts.collectedExpire>=m.INFINITE_CACHE?void 0:K.renderOpts.collectedExpire;return{value:{kind:x.CachedRouteKind.APP_ROUTE,status:o.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:n,expire:a}}}}catch(t){throw(null==a?void 0:a.isStale)&&await R.onRequestError(e,t,{routerKind:"App Router",routePath:o,routeType:"route",revalidateReason:(0,h.getRevalidateReason)({isStaticGeneration:j,isOnDemandRevalidate:A})},!1,S),t}},p=await R.handleResponse({req:e,nextConfig:C,cacheKey:H,routeKind:a.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:I,isRoutePPREnabled:!1,isOnDemandRevalidate:A,revalidateOnlyGenerated:N,responseGenerator:d,waitUntil:n.waitUntil,isMinimalMode:z});if(!M)return null;if((null==p||null==(s=p.value)?void 0:s.kind)!==x.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==p||null==(l=p.value)?void 0:l.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});z||t.setHeader("x-nextjs-cache",A?"REVALIDATED":p.isMiss?"MISS":p.isStale?"STALE":"HIT"),_&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let c=(0,y.fromNodeOutgoingHttpHeaders)(p.value.headers);return z&&M||c.delete(m.NEXT_CACHE_TAGS_HEADER),!p.cacheControl||t.getHeader("Cache-Control")||c.get("Cache-Control")||c.set("Cache-Control",(0,g.getCacheControlHeader)(p.cacheControl)),await (0,f.sendResponse)(V,G,new Response(p.value.body,{headers:c,status:p.value.status||200})),null};$&&F?await l(F):(r=L.getActiveScopeSpan(),await L.withPropagatedContext(e.headers,()=>L.trace(u.BaseServerSpan.handleRequest,{spanName:`${B} ${o}`,kind:s.SpanKind.SERVER,attributes:{"http.method":B,"http.target":e.url}},l),void 0,!$))}catch(t){if(t instanceof v.NoFallbackError||await R.onRequestError(e,t,{routerKind:"App Router",routePath:D,routeType:"route",revalidateReason:(0,h.getRevalidateReason)({isStaticGeneration:j,isOnDemandRevalidate:A})},!1,S),M)throw t;return await (0,f.sendResponse)(V,G,new Response(null,{status:500})),null}}e.s(["handler",0,E,"patchFetch",0,function(){return(0,r.patchFetch)({workAsyncStorage:C,workUnitAsyncStorage:T})},"routeModule",0,R,"serverHooks",0,_,"workAsyncStorage",0,C,"workUnitAsyncStorage",0,T]),n()}catch(e){n(e)}},!1)];

//# sourceMappingURL=_1rii5wx._.js.map