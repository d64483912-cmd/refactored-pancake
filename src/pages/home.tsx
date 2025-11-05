import { useState } from "react";
import { Starfield } from "@/components/starfield";
import { Paperclip, ArrowRight } from "lucide-react";

export default function Home() {
  const [taskDescription, setTaskDescription] = useState("");
  const [fileName, setFileName] = useState("No file chosen");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
    } else {
      setFileName("No file chosen");
    }
  };

  const handleSubmit = () => {
    console.log("Submitting task:", taskDescription);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0a1929]">
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url(/assets/background.webp)",
          zIndex: 0,
        }}
      />
      
      <Starfield />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-2xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Automate repetitive tasks
          </h1>
          
          <p className="text-xl text-gray-400 mb-12">
            Teach AI to do your repetitive grunt work
          </p>

          <div className="bg-white rounded-2xl p-6 shadow-2xl">
            <div className="mb-4">
              <label
                htmlFor="file-upload"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
              >
                Choose Files
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
              <span className="ml-3 text-sm text-gray-500">{fileName}</span>
            </div>

            <div className="mb-4">
              <input
                type="text"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Help me research loan underwriting data"
                className="w-full px-4 py-3 text-gray-700 bg-white border-0 focus:outline-none text-base"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <Paperclip className="w-5 h-5" />
                <span className="text-sm font-medium">Attach</span>
              </button>

              <button
                onClick={handleSubmit}
                className="flex items-center justify-center w-12 h-12 bg-cyan-400 hover:bg-cyan-500 rounded-full transition-colors shadow-lg"
              >
                <ArrowRight className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
