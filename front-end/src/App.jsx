import ConnectStrangersApp from './components/ConnectStrangersApp';
import { useState } from 'react';

const App = () => {
  const [Start, setStart] = useState(false);

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-indigo-200 via-gray-100 to-indigo-200">
      {!Start ? (
        <div className="flex flex-col justify-center items-center h-full text-center p-4">
          <h1 className="text-4xl font-bold mb-4 text-indigo-700">Welcome to Connect Strangers</h1>
          <p className="text-lg text-gray-700 mb-6 max-w-xl">
            Connect instantly with a stranger across the globe. Click Start to begin a random anonymous conversation.
          </p>
          <button
            onClick={() => setStart(true)}
            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
          >
            Start
          </button>
        </div>
      ) : (
        <ConnectStrangersApp />
      )}
    </div>
  );
};

export default App;
