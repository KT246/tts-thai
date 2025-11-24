import React, { useState, useEffect, useRef } from "react";
import { Volume2, Download, Loader2, PlayCircle, Settings } from "lucide-react";

// CẬP NHẬT: Đã xóa dấu gạch chéo (/) ở cuối để tránh lỗi đường dẫn đôi
const API_BASE_URL = "https://c796e4668ced.ngrok-free.app";

// Định nghĩa kiểu dữ liệu cho Giọng đọc
interface Voice {
  id: string;
  name: string;
}

// Định nghĩa kiểu dữ liệu phản hồi từ API TTS
interface TTSResponse {
  file: string;
}

export default function ThaiTTSApp() {
  // State quản lý dữ liệu với kiểu cụ thể
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [text, setText] = useState<string>("");
  const [rate, setRate] = useState<number>(1.0); // Giá trị hiển thị 1x
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
        // CẬP NHẬT: Thêm header để vượt qua trang cảnh báo của Ngrok
        const res = await fetch(`${API_BASE_URL}/voices`, {
          headers: {
            "ngrok-skip-browser-warning": "true",
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) throw new Error("Không thể kết nối đến Server");

        // Ép kiểu dữ liệu trả về
        const data: Voice[] = await res.json();
        setVoices(data);

        if (data.length > 0) {
          setSelectedVoice(data[0].id);
        }
      } catch (err: any) {
        console.error("Lỗi tải giọng:", err);
        setError(
          "Không thể tải danh sách giọng đọc. Kiểm tra lại ngrok hoặc server."
        );

        // Mock data
        setVoices([
          { id: "th-TH-Standard-A", name: "Thai Female (Standard A)" },
          { id: "th-TH-Standard-B", name: "Thai Male (Standard B)" },
        ]);
        setSelectedVoice("th-TH-Standard-A");
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
      // Công thức chuyển đổi: (Hệ số - 1) * 100
      const ratePercent = Math.round((rate - 1) * 100);

      const params = new URLSearchParams({
        text: text.trim(),
        voice: selectedVoice,
        rate: ratePercent.toString(),
      });

      // CẬP NHẬT: Thêm header ở đây nữa
      const response = await fetch(`${API_BASE_URL}/tts?${params}`, {
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      });

      if (!response.ok) {
        throw new Error(`Lỗi Server: ${response.statusText}`);
      }

      const data: TTSResponse = await response.json();
      const generatedFileName = data.file;

      // Đường dẫn tải về cũng cần bypass nếu fetch trực tiếp, nhưng với thẻ audio src thì trình duyệt sẽ tự xử lý
      // Tuy nhiên, tốt nhất là dùng URL từ ngrok
      const url = `${API_BASE_URL}/download/${generatedFileName}`;

      setFileName(generatedFileName);
      setAudioUrl(url);

      // Tự động phát khi có link
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current
            .play()
            .catch((e) => console.log("Autoplay bị chặn:", e));
        }
      }, 100);
    } catch (err: any) {
      console.error(err);
      setError(`Có lỗi xảy ra: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Các hàm xử lý sự kiện input có định nghĩa kiểu
  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedVoice(e.target.value);
  };

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRate(parseFloat(e.target.value));
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
            {/* Chọn giọng */}
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

            {/* Chỉnh tốc độ */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                  <Settings size={16} /> Tốc độ đọc:
                </label>
                <span className="text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded text-sm">
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
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>0.5x (Chậm)</span>
                <span>3.0x (Nhanh)</span>
              </div>
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
                <PlayCircle /> Generate Speech
              </>
            )}
          </button>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200 text-center">
              {error}
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
              >
                Trình duyệt không hỗ trợ phát âm thanh.
              </audio>

              <a
                href={audioUrl}
                download={`thai_speech_${fileName}`}
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
