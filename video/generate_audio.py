# -*- coding: utf-8 -*-
"""
法治小卫士历险记 — 童声语音生成脚本
使用阿里云 CosyVoice "龙呼呼"(longhuhu) 天真烂漫女童音色

使用步骤：
  1. pip install dashscope
  2. 去阿里云百炼平台申请 API Key: https://bailian.console.aliyun.com/
  3. 将下方 API_KEY 替换为你的密钥
  4. python generate_audio.py
  5. 生成的 mp3 文件会保存在 audio/ 目录下
  6. 推送到 GitHub 即可在视频页面听到真实童声

如果 longhuhu 不可用，可替换为：
  - longshanshan  (戏剧化童声, 6~15岁)
  - longniuniu    (阳光男童声)
  - longxian_v3   (豪放可爱女, 12岁, 需用 cosyvoice-v3-flash)
"""

import os
import sys
import time

try:
    import dashscope
    from dashscope.audio.tts_v2 import SpeechSynthesizer
except ImportError:
    print("请先安装 dashscope:  pip install dashscope")
    sys.exit(1)

# ==================== 配置区 ====================
# 替换为你的阿里云百炼 API Key
API_KEY = "sk-xxxxxxxxxxxxxxxxxxxxxxxx"

# 童声音色
VOICE = "longhuhu"        # 龙呼呼 — 天真烂漫女童
# VOICE = "longshanshan"  # 龙闪闪 — 戏剧化童声 6~15岁
# VOICE = "longniuniu"    # 龙牛牛 — 阳光男童声

# 模型（longhuhu 属于 cosyvoice-v2）
MODEL = "cosyvoice-v2"

# 语音文案 — 与视频字幕完全一致
CAPTIONS = [
    "法治小卫士闪亮登场！",
    "红灯停，绿灯行，安全第一记心里！",
    "捡到东西要交给警察叔叔，这就是拾金不昧！",
    "在学校里，我们互相帮助，拒绝欺凌！",
    "人人争当法治小卫士！",
    "谢谢观看！",
]

# 输出目录
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "audio")
# ==================== 配置区结束 ====================


def generate_audio(text, output_path):
    """调用 CosyVoice 生成语音"""
    synthesizer = SpeechSynthesizer(
        model=MODEL,
        voice=VOICE,
        format="mp3",
        sample_rate=22050,
    )
    audio_data = synthesizer.call(text)
    
    if audio_data is None:
        print(f"  [失败] 返回为空，错误信息: {synthesizer.get_last_response()}")
        return False
    
    # 写入文件
    with open(output_path, "wb") as f:
        f.write(audio_data)
    
    file_size = os.path.getsize(output_path)
    print(f"  [成功] {output_path} ({file_size} bytes)")
    return True


def main():
    # 设置 API Key
    dashscope.api_key = API_KEY
    
    if "xxxxxxxx" in API_KEY:
        print("=" * 60)
        print("  请先设置你的阿里云百炼 API Key！")
        print("  1. 访问 https://bailian.console.aliyun.com/")
        print("  2. 开通服务并创建 API Key")
        print("  3. 将本文件中的 API_KEY 替换为你的密钥")
        print("  4. 重新运行: python generate_audio.py")
        print("=" * 60)
        sys.exit(1)
    
    # 创建输出目录
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    print("=" * 60)
    print(f"  开始生成童声语音")
    print(f"  模型: {MODEL}")
    print(f"  音色: {VOICE} ({'龙呼呼-天真烂漫女童' if VOICE == 'longhuhu' else VOICE})")
    print(f"  输出目录: {OUTPUT_DIR}")
    print("=" * 60)
    
    success_count = 0
    for i, text in enumerate(CAPTIONS):
        output_path = os.path.join(OUTPUT_DIR, f"scene{i}.mp3")
        print(f"\n[{i+1}/{len(CAPTIONS)}] 生成: {text}")
        
        try:
            if generate_audio(text, output_path):
                success_count += 1
            else:
                print(f"  [重试] 1秒后重试...")
                time.sleep(1)
                if generate_audio(text, output_path):
                    success_count += 1
        except Exception as e:
            print(f"  [错误] {e}")
    
    print("\n" + "=" * 60)
    print(f"  完成！成功 {success_count}/{len(CAPTIONS)} 个文件")
    if success_count == len(CAPTIONS):
        print("  所有音频已生成，请执行:")
        print("  git add -A && git commit -m '添加童声语音音频' && git push")
    else:
        print("  部分失败，请检查 API Key 和网络后重试")
    print("=" * 60)


if __name__ == "__main__":
    main()
