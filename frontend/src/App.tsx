import React from 'react';
import "./App.css";
import AppBar from "./Components/AppBar";
import FormCard from "./Components/FormCard";
import { Web3ReactProvider } from '@web3-react/core'
import { Web3Provider } from '@ethersproject/providers'

const getLibrary = (provider: any): Web3Provider => {
  return new Web3Provider(provider)
}

const App: React.FC = () => {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <div className="App">
        <AppBar/>
        <FormCard/>
      </div>
    </Web3ReactProvider>
  );
}

export default App;
