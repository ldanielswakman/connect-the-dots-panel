
import React from "react";
import { CheckCircle, FileText, Info, X } from "lucide-react";
import ProgressStepper from "./ProgressStepper";
import MappingArea from "./MappingArea";

const DataMappingPanel = () => {
  return (
    <div className="w-full max-w-6xl mx-auto bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400" />
          </div>
          <h1 className="text-xl font-medium text-gray-800">New Product Finder</h1>
        </div>
        
        <div className="flex items-center gap-8">
          <ProgressStepper 
            steps={[
              { number: 1, label: "Import source", active: true, completed: true },
              { number: 2, label: "Map fields", active: true, completed: false },
              { number: 3, label: "Map Results", active: false, completed: false },
            ]}
          />
          
          <button className="flex items-center text-gray-600 hover:text-gray-900">
            <X className="w-5 h-5 mr-1" />
            Close
          </button>
        </div>
      </div>
      
      {/* Success Banner */}
      <div className="bg-gray-50 p-6">
        <div className="flex items-start gap-4">
          <div className="text-emerald-500 mt-1">
            <CheckCircle className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-xl font-medium text-gray-800 mb-1">Data source successfully imported!</h2>
            <p className="text-gray-600">We found the following attributes and mapped them to fields:</p>
          </div>
        </div>
        
        <div className="flex justify-end mt-4 items-center gap-4">
          <div className="flex items-center gap-2">
            <Info className="text-amber-400 w-5 h-5" />
            <span className="text-gray-600">3 of 4 required attributes mapped</span>
          </div>
          
          <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-md transition-colors">
            Finalise
          </button>
        </div>
      </div>
      
      {/* Mapping Area */}
      <MappingArea />
    </div>
  );
};

export default DataMappingPanel;
