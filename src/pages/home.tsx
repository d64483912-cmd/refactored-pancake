import { useState } from "react";
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
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
          Automate repetitive tasks
        </h1>
        
        <p className="text-xl text-muted-foreground mb-12">
          Teach AI to do your repetitive grunt work
        </p>

        <div className="bg-card rounded-2xl p-6 shadow-xl border">
          <div className="mb-4">
            <label
              htmlFor="file-upload"
              className="inline-flex items-center px-4 py-2 border border-input rounded-lg text-sm font-medium bg-background hover:bg-accent cursor-pointer transition-colors"
            >
              Choose Files
              <input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
            <span className="ml-3 text-sm text-muted-foreground">{fileName}</span>
          </div>

          <div className="mb-4">
            <input
              type="text"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Help me research loan underwriting data"
              className="w-full px-4 py-3 bg-background border-0 focus:outline-none text-base"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              <Paperclip className="w-5 h-5" />
              <span className="text-sm font-medium">Attach</span>
            </button>

            <button
              onClick={handleSubmit}
              className="flex items-center justify-center w-12 h-12 bg-primary hover:bg-primary/90 rounded-full transition-colors shadow-lg"
            >
              <ArrowRight className="w-6 h-6 text-primary-foreground" />
            </button>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold mb-2">AI-Powered</h3>
            <p className="text-sm text-muted-foreground">
              Advanced AI models understand your requirements and generate production-ready code
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold mb-2">Multi-Language</h3>
            <p className="text-sm text-muted-foreground">
              Generate code in Python, JavaScript, TypeScript, and Bash with proper structure
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold mb-2">Production Ready</h3>
            <p className="text-sm text-muted-foreground">
              Complete solutions with error handling, documentation, and setup instructions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
