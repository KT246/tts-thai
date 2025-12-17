import React, { useState, useEffect, useRef } from "react";
import {
  Volume2,
  Download,
  Loader2,
  PlayCircle,
  Settings,
  Music,
  AlertCircle,
  Mic,
} from "lucide-react";

// --- CẤU HÌNH SERVER ---
// 1. Chạy server.py trên máy tính: python server.py
// 2. Dùng ngrok để public port 8000: ngrok http 8000
// 3. Copy link https từ ngrok dán vào dưới đây (bỏ dấu / ở cuối)
const API_BASE_URL = "https://ffdf2e2bbaaf.ngrok-free.app";

// Định nghĩa kiểu dữ liệu cho Giọng đọc
interface Voice {
  id: string;
  name: string;
  gender?: string;
}

// Định nghĩa kiểu dữ liệu phản hồi từ API TTS
interface TTSResponse {
  file: string;
  message: string;
  url?: string; // Server trả về thêm url đầy đủ (nếu có)
}

export default function App() {
  // State quản lý dữ liệu
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [text, setText] = useState<string>("สวัสดีครับ ยินดีที่ได้รู้จัก"); // Text mặc định

  // State cho Tốc độ và Cao độ
  const [rate, setRate] = useState<number>(1.0); // Giá trị hiển thị 1x
  const [pitch, setPitch] = useState<number>(0); // Giá trị mặc định 0Hz

  const [loading, setLoading] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Ref cho thẻ Audio element
  const audioRef = useRef<HTMLAudioElement>(null);

  // 1. Tải danh sách giọng khi component được mount
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/voices`, {
          headers: {
            "ngrok-skip-browser-warning": "true",
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) throw new Error("Không thể kết nối đến Server");

        const data: Voice[] = await res.json();
        setVoices(data);

        // Tự động chọn giọng đầu tiên nếu có
        if (data.length > 0) {
          setSelectedVoice(data[0].id);
        }
      } catch (err: any) {
        console.error("Lỗi tải giọng:", err);
        setError(
          `Không thể kết nối tới Server. Hãy kiểm tra lại link Ngrok trong code hoặc đảm bảo server.py đang chạy.`
        );

        // Mock data để demo giao diện nếu lỗi
        const mockVoices = [
          {
            id: "th-TH-PremwadeeNeural",
            name: "Premwadee (Nữ - Dịu dàng)",
            gender: "Female",
          },
          {
            id: "th-TH-NiwatNeural",
            name: "Niwat (Nam - Trầm ấm)",
            gender: "Male",
          },
        ];
        setVoices(mockVoices);
        if (!selectedVoice) setSelectedVoice(mockVoices[0].id);
      }
    };

    fetchVoices();
  }, []);

  // 2. Hàm xử lý tạo giọng nói
  const handleGenerate = async () => {
    if (!text.trim()) {
      alert("Vui lòng nhập văn bản tiếng Thái!");
      return;
    }

    setLoading(true);
    setAudioUrl(null);
    setError("");

    try {
      // Công thức chuyển đổi Rate: (Hệ số - 1) * 100
      // Ví dụ: 1.5x -> +50%, 0.8x -> -20%
      const ratePercent = Math.round((rate - 1) * 100);

      // Tạo params gửi đi
      const params = new URLSearchParams({
        text: text.trim(),
        voice: selectedVoice,
        rate: ratePercent.toString(),
        pitch: pitch.toString(),
      });

      const response = await fetch(`${API_BASE_URL}/tts?${params}`, {
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `Lỗi Server: ${response.statusText}`
        );
      }

      const data: TTSResponse = await response.json();

      // Ưu tiên dùng URL server trả về, nếu không thì tự tạo
      let finalUrl = "";
      if (data.url && data.url.startsWith("http")) {
        finalUrl = data.url;
      } else {
        finalUrl = `${API_BASE_URL}/download/${data.file}`;
      }

      setFileName(data.file);
      setAudioUrl(finalUrl);

      // Tự động phát khi có link
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current
            .play()
            .catch((e) => console.log("Autoplay bị chặn hoặc lỗi:", e));
        }
      }, 100);
    } catch (err: any) {
      console.error(err);
      setError(`Có lỗi xảy ra: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Các hàm xử lý sự kiện input
  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedVoice(e.target.value);
  };

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRate(parseFloat(e.target.value));
  };

  const handlePitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPitch(parseFloat(e.target.value));
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans text-slate-800">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-blue-600 p-6 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,white,transparent)] animate-pulse"></div>
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center justify-center gap-2 relative z-10">
            <span className="text-3xl">🇹🇭</span> Thai Text-to-Speech
          </h1>
          <p className="text-blue-100 text-sm mt-1 relative z-10">
            Chuyển đổi văn bản tiếng Thái sang giọng nói tự nhiên
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Controls Area */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            {/* 1. Chọn giọng */}
            <div>
              <label className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                <Mic size={16} className="text-blue-500" /> Chọn giọng đọc:
              </label>
              <select
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm"
                value={selectedVoice}
                onChange={handleVoiceChange}
              >
                {voices.length === 0 ? (
                  <option>Đang tải danh sách giọng...</option>
                ) : (
                  voices.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 2. Chỉnh tốc độ (Rate) */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                    <Settings size={16} className="text-slate-500" /> Tốc độ:
                  </label>
                  <span className="text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded text-xs border border-blue-100">
                    {rate}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={rate}
                  onChange={handleRateChange}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* 3. Chỉnh cao độ (Pitch) */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                    <Music size={16} className="text-slate-500" /> Cao độ:
                  </label>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-xs border ${
                      pitch === 0
                        ? "text-slate-500 bg-slate-100 border-slate-200"
                        : "text-indigo-600 bg-indigo-50 border-indigo-100"
                    }`}
                  >
                    {pitch > 0 ? `+${pitch}Hz` : `${pitch}Hz`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-20"
                  max="20"
                  step="1"
                  value={pitch}
                  onChange={handlePitchChange}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>

            {/* Chú thích nhỏ cho thanh trượt */}
            <div className="flex justify-between text-[10px] text-slate-400 px-1 uppercase tracking-wider font-medium">
              <span>Trầm / Chậm</span>
              <span>Cao / Nhanh</span>
            </div>
          </div>

          {/* Text Area */}
          <div className="relative">
            <textarea
              className="w-full h-32 p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition text-lg leading-relaxed shadow-sm"
              placeholder="Nhập văn bản tiếng Thái vào đây... (Ví dụ: สวัสดีครับ)"
              value={text}
              onChange={handleTextChange}
            ></textarea>
            <div className="absolute bottom-3 right-3 text-xs text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-100 shadow-sm">
              {text.length} ký tự
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleGenerate}
            disabled={loading || !text.trim()}
            className={`w-full py-3.5 px-6 rounded-xl text-white font-bold text-lg shadow-md transition-all flex items-center justify-center gap-2 transform active:translate-y-0.5
              ${
                loading || !text.trim()
                  ? "bg-slate-400 cursor-not-allowed shadow-none"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:-translate-y-0.5"
              }`}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" /> Đang xử lý...
              </>
            ) : (
              <>
                <PlayCircle fill="currentColor" className="text-white/20" /> Tạo
                Giọng Nói
              </>
            )}
          </button>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Result Area */}
          {audioUrl && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-500 bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="font-semibold text-slate-700 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                <Volume2 className="text-blue-600" size={18} /> Kết quả:
              </p>

              <audio
                ref={audioRef}
                controls
                src={audioUrl}
                className="w-full mb-4 accent-blue-600 h-10"
                onError={() =>
                  setError(
                    "Không thể tải file âm thanh. Link có thể đã hết hạn hoặc ngrok bị lỗi."
                  )
                }
              >
                Trình duyệt không hỗ trợ phát âm thanh.
              </audio>

              <a
                href={audioUrl}
                download={`thai_speech_${fileName}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-white border border-green-500 text-green-600 hover:bg-green-50 font-semibold rounded-lg transition shadow-sm"
              >
                <Download size={18} /> Tải file MP3
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-3 text-center border-t border-slate-200">
          <p className="text-xs text-slate-400">
            Powered by Edge TTS & FastAPI
          </p>
        </div>
      </div>
    </div>
  );
}
