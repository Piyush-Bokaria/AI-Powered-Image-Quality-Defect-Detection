import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { ToastProvider } from './components/ui/Toast';
import { AnalyzePage } from './pages/AnalyzePage';
import { HistoryPage } from './pages/HistoryPage';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <div className="min-h-screen bg-[#0a0a0f] text-zinc-200">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<AnalyzePage />} />
              <Route path="/history" element={<HistoryPage />} />
            </Routes>
          </main>
        </div>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
