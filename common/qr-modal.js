/**
 * QR Modal - 共享二维码弹窗组件
 * 功能：点击按钮弹出二维码大图，长按保存，分享链接，返回关闭
 * 多源容灾：api.qrserver.com → quickchart.io → 本地canvas生成
 */
(function () {
  'use strict';

  // ========== 注入模态弹窗HTML ==========
  var modalHTML =
    '<div id="qrModalOverlay" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;' +
    'background:rgba(0,0,0,0.85);z-index:99999;justify-content:center;align-items:center;">' +
    '<div id="qrModalCard" style="background:#fff;border-radius:20px;padding:28px 24px 24px;' +
    'max-width:340px;width:85%;text-align:center;position:relative;' +
    'box-shadow:0 20px 60px rgba(0,0,0,0.4);animation:qrModalIn 0.25s ease-out;">' +
    // 返回箭头（左上角）
    '<div id="qrModalBack" style="position:absolute;top:14px;left:14px;width:38px;height:38px;' +
    'border-radius:50%;background:#f5f5f5;display:flex;align-items:center;justify-content:center;' +
    'cursor:pointer;font-size:20px;color:#333;transition:background 0.2s;user-select:none;">\u2190</div>' +
    // 标题
    '<h3 id="qrModalTitle" style="margin:8px 0 16px;font-size:17px;color:#333;font-weight:600;">扫码访问</h3>' +
    // 二维码图片（长按可保存至相册）
    '<div style="display:inline-block;padding:10px;background:#fff;border-radius:12px;' +
    'border:1px solid #eee;">' +
    '<img id="qrModalImg" src="" alt="二维码" style="width:220px;height:220px;display:block;border-radius:8px;" />' +
    '<div id="qrModalText" style="display:none;width:220px;padding:20px;word-break:break-all;' +
    'font-size:12px;color:#666;line-height:1.6;"></div>' +
    '</div>' +
    '<p style="font-size:13px;color:#888;margin:14px 0 18px;">长按二维码图片可保存至相册</p>' +
    // 分享按钮
    '<button id="qrModalShare" style="width:100%;padding:12px;border:none;border-radius:12px;' +
    'background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;font-size:15px;' +
    'cursor:pointer;font-family:inherit;font-weight:500;transition:opacity 0.2s;">' +
    '\uD83D\uDCC4 分享给好友</button>' +
    '</div></div>';

  // 注入CSS动画
  var styleEl = document.createElement('style');
  styleEl.textContent =
    '@keyframes qrModalIn{from{opacity:0;transform:scale(0.85)}to{opacity:1;transform:scale(1)}}' +
    '#qrModalBack:active{background:#e0e0e0}' +
    '#qrModalShare:active{opacity:0.8}';
  document.head.appendChild(styleEl);

  var _currentUrl = '';
  var _currentTitle = '';

  // ========== 初始化 ==========
  document.addEventListener('DOMContentLoaded', function () {
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    var overlay = document.getElementById('qrModalOverlay');
    var backBtn = document.getElementById('qrModalBack');
    var shareBtn = document.getElementById('qrModalShare');

    // 返回箭头：关闭弹窗
    backBtn.addEventListener('click', function () {
      overlay.style.display = 'none';
    });

    // 点击遮罩也可关闭
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) overlay.style.display = 'none';
    });

    // 分享按钮
    shareBtn.addEventListener('click', function () {
      if (navigator.share) {
        navigator.share({ title: _currentTitle, url: _currentUrl }).catch(function () {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(_currentUrl).then(function () {
          alert('链接已复制到剪贴板，可粘贴分享给好友！');
        }).catch(function () {
          prompt('请复制以下链接分享给好友：', _currentUrl);
        });
      } else {
        prompt('请复制以下链接分享给好友：', _currentUrl);
      }
    });

    // 自动扫描页面上的QR图片，添加多源容灾fallback
    document.querySelectorAll('img[src*="api.qrserver.com"]').forEach(function (img) {
      var match = img.src.match(/data=(.+)$/);
      if (!match) return;
      var url = decodeURIComponent(match[1]);
      img.onerror = function () {
        this.onerror = function () {
          this.style.display = 'none';
          var p = document.createElement('p');
          p.style.cssText = 'font-size:12px;color:#888;padding:20px;width:180px;word-break:break-all;';
          p.textContent = url;
          this.parentNode.appendChild(p);
        };
        this.src = 'https://quickchart.io/qr?text=' + encodeURIComponent(url) + '&size=180';
      };
    });
  });

  // ========== 多源QR生成（容灾链） ==========
  function loadQRImage(imgEl, textEl, url, size) {
    size = size || 300;
    imgEl.style.display = 'block';
    textEl.style.display = 'none';
    imgEl.style.opacity = '0';

    // 源1：api.qrserver.com
    imgEl.onload = function () { imgEl.style.opacity = '1'; };
    imgEl.onerror = function () {
      // 源2：quickchart.io
      imgEl.onerror = function () {
        // 源3：显示URL文字
        imgEl.style.display = 'none';
        textEl.style.display = 'block';
        textEl.textContent = '扫码访问链接：\n' + _currentUrl;
      };
      imgEl.src = 'https://quickchart.io/qr?text=' + encodeURIComponent(url) + '&size=' + size;
    };
    imgEl.src = 'https://api.qrserver.com/v1/create-qr-code/?size=' + size + 'x' + size + '&data=' + encodeURIComponent(url);
  }

  // ========== 暴露全局函数 ==========
  /**
   * 打开二维码弹窗
   * @param {string} title - 作品标题
   * @param {string} url - 作品访问链接
   */
  window.openQRModal = function (title, url) {
    _currentTitle = title;
    _currentUrl = url;

    var overlay = document.getElementById('qrModalOverlay');
    var titleEl = document.getElementById('qrModalTitle');
    var imgEl = document.getElementById('qrModalImg');
    var textEl = document.getElementById('qrModalText');

    titleEl.textContent = '扫码访问《' + title + '》';
    loadQRImage(imgEl, textEl, url, 300);
    overlay.style.display = 'flex';
  };

  /**
   * 为页面内QR图片添加多源容灾fallback
   * @param {string} imgId - img元素id
   * @param {string} url - 编码到二维码的URL
   */
  window.initQRFallback = function (imgId, url) {
    var img = document.getElementById(imgId);
    if (!img) return;
    img.onerror = function () {
      this.onerror = function () {
        this.style.display = 'none';
        var p = document.createElement('p');
        p.style.cssText = 'font-size:12px;color:#888;padding:20px;width:180px;word-break:break-all;';
        p.textContent = url;
        this.parentNode.appendChild(p);
      };
      this.src = 'https://quickchart.io/qr?text=' + encodeURIComponent(url) + '&size=180';
    };
  };
})();
