import React, { useState, useEffect, useRef } from "react";
import {
  Volume2,
  Download,
  Loader2,
  PlayCircle,
  Settings,
  Music,
  AlertCircle,
} from "lucide-react";

// CẤU HÌNH SERVER:
// Nếu chạy local python server.py -> dùng http://localhost:8000
// Nếu dùng Ngrok -> dán link Ngrok vào đây (bỏ dấu / ở cuối)
const API_BASE_URL = "https://432b6e98822c.ngrok-free.app";

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
}

export default function App() {
  // State quản lý dữ liệu với kiểu cụ thể
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [text, setText] = useState<string>("");

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
          "Không thể kết nối tới Server (localhost:8000). Hãy chắc chắn bạn đã chạy file server.py"
        );

        // Mock data khớp với server để test giao diện
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
          {
            id: "th-TH-SomsakNeural",
            name: "Somsak (Nam - Trầm ấm)",
            gender: "Male",
          },
        ];
        setVoices(mockVoices);
        setSelectedVoice(mockVoices[0].id);
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
      const generatedFileName = data.file;

      const url = `${API_BASE_URL}/download/${generatedFileName}`;

      setFileName(generatedFileName);
      setAudioUrl(url);

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
        <div className="bg-blue-600 p-6 text-center">
          <h1 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
            <span>🇹🇭</span> Thai Text-to-Speech
          </h1>
          <p className="text-blue-100 text-sm mt-1">
            Chuyển đổi văn bản tiếng Thái sang giọng nói
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Controls Area */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            {/* 1. Chọn giọng */}
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                <Volume2 size={16} /> Chọn giọng đọc:
              </label>
              <select
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
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
                    <Settings size={16} /> Tốc độ:
                  </label>
                  <span className="text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded text-xs">
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
                  className="w-full h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* 3. Chỉnh cao độ (Pitch) */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                    <Music size={16} /> Cao độ:
                  </label>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-xs ${
                      pitch === 0
                        ? "text-slate-500 bg-slate-100"
                        : "text-indigo-600 bg-indigo-50"
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
                  className="w-full h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>

            {/* Chú thích nhỏ cho thanh trượt */}
            <div className="flex justify-between text-xs text-slate-400 px-1">
              <span>Trầm / Chậm</span>
              <span>Cao / Nhanh</span>
            </div>
          </div>

          {/* Text Area */}
          <div>
            <textarea
              className="w-full h-32 p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition text-lg"
              placeholder="Nhập văn bản tiếng Thái vào đây... (Ví dụ: สวัสดีครับ)"
              value={text}
              onChange={handleTextChange}
            ></textarea>
          </div>

          {/* Action Button */}
          <button
            onClick={handleGenerate}
            disabled={loading || !text.trim()}
            className={`w-full py-3.5 px-6 rounded-xl text-white font-bold text-lg shadow-md transition-all flex items-center justify-center gap-2
              ${
                loading || !text.trim()
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg active:scale-95"
              }`}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" /> Đang xử lý...
              </>
            ) : (
              <>
                <PlayCircle /> Tạo Giọng Nói
              </>
            )}
          </button>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200 flex items-start gap-2">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Result Area */}
          {audioUrl && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-500 border-t border-slate-100 pt-6 mt-4">
              <p className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Volume2 className="text-blue-600" /> Nghe thử:
              </p>

              <audio
                ref={audioRef}
                controls
                src={audioUrl}
                className="w-full mb-4 accent-blue-600"
                onError={() =>
                  setError(
                    "Không thể tải file âm thanh. Link có thể đã hết hạn."
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
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition shadow-sm"
              >
                <Download size={18} /> Tải file MP3
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
