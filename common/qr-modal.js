/**
 * QR Modal - 共享二维码弹窗组件
 * 功能：点击按钮弹出二维码大图，长按保存，分享二维码图片，返回关闭
 * 多源容灾：api.qrserver.com → quickchart.io → 本地URL文字
 * 响应式：自适应手机/平板/电脑各种屏幕
 */
(function () {
  'use strict';

  // ========== 注入模态弹窗HTML ==========
  var modalHTML =
    '<div id="qrModalOverlay" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;' +
    'background:rgba(0,0,0,0.85);z-index:99999;justify-content:center;align-items:center;' +
    'padding:16px;box-sizing:border-box;overflow-y:auto;-webkit-overflow-scrolling:touch;">' +
    '<div id="qrModalCard" style="background:#fff;border-radius:20px;padding:28px 22px 22px;' +
    'max-width:340px;width:100%;text-align:center;position:relative;' +
    'box-shadow:0 20px 60px rgba(0,0,0,0.4);animation:qrModalIn 0.25s ease-out;' +
    'box-sizing:border-box;margin:auto;">' +
    // 返回箭头
    '<div id="qrModalBack" style="position:absolute;top:14px;left:14px;width:38px;height:38px;' +
    'border-radius:50%;background:#f5f5f5;display:flex;align-items:center;justify-content:center;' +
    'cursor:pointer;font-size:20px;color:#333;transition:background 0.2s;user-select:none;' +
    'flex-shrink:0;">\u2190</div>' +
    // 标题
    '<h3 id="qrModalTitle" style="margin:8px 0 16px;font-size:17px;color:#333;font-weight:600;' +
    'word-break:break-word;line-height:1.4;">扫码访问</h3>' +
    // 二维码图片
    '<div style="display:inline-block;padding:10px;background:#fff;border-radius:12px;' +
    'border:1px solid #eee;max-width:100%;">' +
    '<img id="qrModalImg" src="" alt="二维码" style="width:220px;height:220px;max-width:100%;' +
    'height:auto;display:block;border-radius:8px;" />' +
    '<div id="qrModalText" style="display:none;width:220px;max-width:100%;padding:20px;' +
    'word-break:break-all;font-size:12px;color:#666;line-height:1.6;"></div>' +
    '</div>' +
    '<p style="font-size:13px;color:#888;margin:14px 0 18px;line-height:1.5;">' +
    '长按二维码图片可保存至相册</p>' +
    // 分享按钮
    '<button id="qrModalShare" style="width:100%;padding:13px;border:none;border-radius:12px;' +
    'background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;font-size:15px;' +
    'cursor:pointer;font-family:inherit;font-weight:500;transition:opacity 0.2s;margin-bottom:10px;' +
    'min-height:48px;-webkit-tap-highlight-color:transparent;">' +
    '\uD83D\uDCC4 分享二维码给好友</button>' +
    // 保存二维码图片按钮
    '<button id="qrModalSave" style="width:100%;padding:11px;border:1px solid #ddd;border-radius:12px;' +
    'background:#fff;color:#666;font-size:14px;cursor:pointer;font-family:inherit;' +
    'transition:opacity 0.2s;margin-bottom:10px;min-height:44px;-webkit-tap-highlight-color:transparent;">' +
    '\uD83D\uDCBE 保存二维码图片</button>' +
    // 复制链接按钮
    '<button id="qrModalCopy" style="width:100%;padding:11px;border:1px solid #ddd;border-radius:12px;' +
    'background:#fff;color:#666;font-size:14px;cursor:pointer;font-family:inherit;' +
    'transition:opacity 0.2s;min-height:44px;-webkit-tap-highlight-color:transparent;">' +
    '\uD83D\uDCBD 复制访问链接</button>' +
    '</div></div>';

  // ========== 注入CSS ==========
  var styleEl = document.createElement('style');
  styleEl.textContent =
    '@keyframes qrModalIn{from{opacity:0;transform:scale(0.85)}to{opacity:1;transform:scale(1)}}' +
    '#qrModalBack:active{background:#e0e0e0}' +
    '#qrModalShare:active{opacity:0.8}' +
    '#qrModalSave:active{opacity:0.8}' +
    '#qrModalCopy:active{opacity:0.8}' +
    // 分享指引浮层
    '#qrShareTip{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);' +
    'z-index:100000;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;}' +
    '#qrShareTipBox{background:#fff;border-radius:16px;padding:28px 22px;max-width:320px;width:100%;' +
    'text-align:center;box-sizing:border-box;animation:qrModalIn 0.25s ease-out;}' +
    '@media (max-width:360px){#qrModalCard{padding:24px 16px 18px}#qrModalImg{width:180px;height:180px}' +
    '#qrModalTitle{font-size:15px}#qrModalShare,#qrModalSave,#qrModalCopy{font-size:13px;padding:10px}}' +
    '@media (min-width:769px){#qrModalCard{max-width:380px}#qrModalImg{width:260px;height:260px}}';
  document.head.appendChild(styleEl);

  var _currentUrl = '';
  var _currentTitle = '';

  // ========== 检测浏览器环境 ==========
  function detectBrowser() {
    var ua = navigator.userAgent.toLowerCase();
    return {
      isWeChat: ua.indexOf('micromessenger') > -1,
      isQQ: ua.indexOf('qq/') > -1 || ua.indexOf('tbs') > -1,
      isMobile: /android|iphone|ipod|ipad|windows phone|mobile/i.test(ua),
      isIOS: /iphone|ipod|ipad/.test(ua)
    };
  }

  // ========== 显示分享指引（微信/QQ内置浏览器专用） ==========
  function showShareGuide() {
    var browser = detectBrowser();
    var tip = '';

    if (browser.isWeChat) {
      tip = '<div style="font-size:22px;margin-bottom:16px;">\uD83D\uDC4B</div>' +
        '<h3 style="font-size:16px;color:#333;margin:0 0 16px;">微信内分享方法</h3>' +
        '<div style="text-align:left;font-size:14px;color:#666;line-height:2;">' +
        '<b>方法一（推荐）：</b><br>' +
        '1. 长按上方二维码图片<br>' +
        '2. 选择"保存图片"到手机相册<br>' +
        '3. 在微信聊天中点击"+"选择图片发送<br><br>' +
        '<b>方法二：</b><br>' +
        '1. 点击右上角 <b>···</b> 菜单<br>' +
        '2. 选择"发送给朋友"<br>' +
        '3. 选择要分享的好友或群聊' +
        '</div>';
    } else if (browser.isQQ) {
      tip = '<div style="font-size:22px;margin-bottom:16px;">\uD83D\uDC4B</div>' +
        '<h3 style="font-size:16px;color:#333;margin:0 0 16px;">QQ内分享方法</h3>' +
        '<div style="text-align:left;font-size:14px;color:#666;line-height:2;">' +
        '<b>方法一：</b><br>' +
        '1. 长按上方二维码图片<br>' +
        '2. 选择"保存图片"到手机<br>' +
        '3. 在QQ聊天中选择图片发送<br><br>' +
        '<b>方法二：</b><br>' +
        '1. 点击右上角菜单按钮<br>' +
        '2. 选择"分享给好友"' +
        '</div>';
    } else {
      tip = '<div style="font-size:22px;margin-bottom:16px;">\uD83D\uDC4B</div>' +
        '<h3 style="font-size:16px;color:#333;margin:0 0 16px;">分享方法</h3>' +
        '<div style="text-align:left;font-size:14px;color:#666;line-height:2;">' +
        '1. 长按上方二维码图片保存到相册<br>' +
        '2. 打开微信或QQ聊天窗口<br>' +
        '3. 点击"+"选择图片发送给好友' +
        '</div>';
    }

    tip += '<button id="qrTipClose" style="margin-top:20px;width:100%;padding:12px;border:none;' +
      'border-radius:12px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;' +
      'font-size:15px;cursor:pointer;font-family:inherit;font-weight:500;">我知道了</button>';

    var tipEl = document.createElement('div');
    tipEl.id = 'qrShareTip';
    tipEl.innerHTML = '<div id="qrShareTipBox">' + tip + '</div>';
    document.body.appendChild(tipEl);

    document.getElementById('qrTipClose').addEventListener('click', function () {
      tipEl.remove();
    });
    // 点击遮罩关闭
    tipEl.addEventListener('click', function (e) {
      if (e.target === tipEl) tipEl.remove();
    });
  }

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

    // ========== 分享按钮 ==========
    shareBtn.addEventListener('click', function () {
      var browser = detectBrowser();
      var shareText = '扫码访问《' + _currentTitle + '》';

      // 微信/QQ内置浏览器：navigator.share不可用，显示指引
      if (browser.isWeChat || browser.isQQ) {
        showShareGuide();
        return;
      }

      // 非微信/QQ浏览器：尝试系统分享
      shareBtn.textContent = '\u23F3 正在准备...';
      shareBtn.style.opacity = '0.7';

      // 从quickchart.io获取二维码图片（支持CORS，可转为File对象）
      fetchQRBlob(_currentUrl, 400)
        .then(function (blob) {
          var file = new File([blob], _currentTitle + '_二维码.png', { type: 'image/png' });

          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            // 手机Chrome/Safari：通过系统分享面板发送二维码图片
            // 分享面板会显示微信、QQ等已安装的聊天app
            navigator.share({
              title: _currentTitle,
              text: shareText,
              files: [file]
            }).catch(function () {
              // 用户取消分享，静默处理
            });
          } else if (navigator.share) {
            // 不支持文件分享但支持URL/文字分享
            navigator.share({
              title: _currentTitle,
              text: shareText,
              url: _currentUrl
            }).catch(function () {});
          } else {
            // 不支持系统分享：保存图片 + 显示指引
            saveImageToDevice(blob, _currentTitle + '_二维码.png');
            showShareGuide();
          }
        })
        .catch(function () {
          // fetch失败：尝试直接下载当前显示的图片
          var modalImg = document.getElementById('qrModalImg');
          if (modalImg.src) {
            downloadImageDirect(modalImg.src, _currentTitle + '_二维码.png');
            showShareGuide();
          } else {
            copyUrlToClipboard();
          }
        })
        .finally(function () {
          shareBtn.textContent = '\uD83D\uDCC4 分享二维码给好友';
          shareBtn.style.opacity = '1';
        });
    });

    // ========== 保存二维码图片按钮 ==========
    var saveBtn = document.getElementById('qrModalSave');
    saveBtn.addEventListener('click', function () {
      saveBtn.textContent = '\u23F3 正在保存...';
      saveBtn.style.opacity = '0.7';

      fetchQRBlob(_currentUrl, 400)
        .then(function (blob) {
          saveImageToDevice(blob, _currentTitle + '_二维码.png');
          alert('\u2705 二维码图片已保存！\n\n请打开微信或QQ，在聊天中选择图片发送给好友。');
        })
        .catch(function () {
          var modalImg = document.getElementById('qrModalImg');
          if (modalImg.src) {
            downloadImageDirect(modalImg.src, _currentTitle + '_二维码.png');
            alert('\u2705 二维码图片已保存！\n\n请打开微信或QQ，在聊天中选择图片发送给好友。');
          } else {
            copyUrlToClipboard();
          }
        })
        .finally(function () {
          saveBtn.textContent = '\uD83D\uDCBE 保存二维码图片';
          saveBtn.style.opacity = '1';
        });
    });

    // ========== 复制链接按钮 ==========
    var copyBtn = document.getElementById('qrModalCopy');
    copyBtn.addEventListener('click', function () {
      copyBtn.textContent = '\u23F3 复制中...';
      copyBtn.style.opacity = '0.7';
      copyUrlToClipboard(function () {
        copyBtn.textContent = '\u2705 已复制';
        setTimeout(function () {
          copyBtn.textContent = '\uD83D\uDCBD 复制访问链接';
          copyBtn.style.opacity = '1';
        }, 1500);
      });
    });

    // ========== 辅助函数 ==========
    function fetchQRBlob(url, size) {
      return fetch('https://quickchart.io/qr?text=' + url + '&size=' + size)
        .then(function (res) { return res.blob(); });
    }

    function saveImageToDevice(blob, filename) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    }

    function downloadImageDirect(imgSrc, filename) {
      var a = document.createElement('a');
      a.href = imgSrc;
      a.download = filename;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    function copyUrlToClipboard(callback) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(_currentUrl).then(function () {
          alert('\u2705 链接已复制到剪贴板！\n\n可粘贴发送给好友。');
          if (callback) callback();
        }).catch(function () {
          fallbackCopy();
        });
      } else {
        fallbackCopy();
      }

      function fallbackCopy() {
        var textarea = document.createElement('textarea');
        textarea.value = _currentUrl;
        textarea.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand('copy');
          alert('\u2705 链接已复制到剪贴板！\n\n可粘贴发送给好友。');
        } catch (e) {
          prompt('请手动复制以下链接分享给好友：', _currentUrl);
        }
        document.body.removeChild(textarea);
        if (callback) callback();
      }
    }

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
        this.src = 'https://quickchart.io/qr?text=' + url + '&size=180';
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
      imgEl.src = 'https://quickchart.io/qr?text=' + url + '&size=' + size;
    };
    imgEl.src = 'https://api.qrserver.com/v1/create-qr-code/?size=' + size + 'x' + size + '&data=' + url;
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
      this.src = 'https://quickchart.io/qr?text=' + url + '&size=180';
    };
  };
})();
