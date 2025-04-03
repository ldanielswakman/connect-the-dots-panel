import React, { useState, useRef, useEffect } from "react";
import { FileText, Plus, Trash2 } from "lucide-react";
import ConnectionLine from "./ConnectionLine";

// Types for our source and target fields
interface Field {
  id: string;
  name: string;
  exampleContent?: string;
  required?: boolean;
  active?: boolean;
}

// Type for the mapping connection
interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
}

const MappingArea: React.FC = () => {
  // Define source fields (left side)
  const sourceFields: Field[] = [
    { id: "sku-id", name: "SKU ID", exampleContent: "1, 2, 3, 4, 5" },
    { id: "image-url", name: "Image URL", exampleContent: "https://store.storeimages.cdn-a..." },
    { id: "title", name: "Title", exampleContent: "iPhone 15 Pro - Black, iPhone 1..." },
    { id: "description", name: "Description", exampleContent: "General features A17 Pro ..." },
    { id: "retail-price", name: "Retail Price", exampleContent: "999, 1099, 1399, 1599, 799" },
    { id: "url", name: "URL", exampleContent: "https://www.apple.com/iphone-16/" },
    { id: "color", name: "Color", exampleContent: "Black Titanium, Natural Titaniu..." },
    { id: "capacity", name: "Capacity", exampleContent: "128, 256, 512, 1024" },
    { id: "display-size", name: "Display Size", exampleContent: "Color" },
  ];

  // Define target fields (right side)
  const targetFields: Field[] = [
    { id: "id", name: "ID", required: true },
    { id: "product-name", name: "Product Name", required: true },
    { id: "product-url", name: "Product URL", required: true },
    { id: "image", name: "Image", required: true },
    { id: "description", name: "Description" },
    { id: "price", name: "Price" },
  ];

  // State for connections between fields
  const [connections, setConnections] = useState<Connection[]>([]);
  
  // State for the currently drawing connection
  const [drawingConnection, setDrawingConnection] = useState<{
    source: string;
    mouseX: number;
    mouseY: number;
  } | null>(null);

  // Refs for the dot elements (to get their positions)
  const sourceDotsRef = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const targetDotsRef = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  // Ref for the container element (to calculate relative positions)
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State for the connection being hovered (to show the delete button)
  const [hoveredConnection, setHoveredConnection] = useState<string | null>(null);
  
  // Initialize default connections
  useEffect(() => {
    // Set default connections that should be active on load
    setConnections([
      { id: "conn-1", sourceId: "sku-id", targetId: "id" },
      { id: "conn-2", sourceId: "title", targetId: "product-name" },
      { id: "conn-3", sourceId: "url", targetId: "product-url" },
    ]);
  }, []);

  // Get the center position of a dot element
  const getDotPosition = (element: HTMLDivElement | null) => {
    if (!element || !containerRef.current) return { x: 0, y: 0 };
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    
    return {
      x: rect.left + rect.width / 2 - containerRect.left,
      y: rect.top + rect.height / 2 - containerRect.top,
    };
  };

  // Start drawing a connection
  const handleDragStart = (sourceId: string, e: React.MouseEvent) => {
    // Only allow one connection per dot
    if (connections.some(conn => conn.sourceId === sourceId)) {
      return;
    }
    
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      setDrawingConnection({
        source: sourceId,
        mouseX: e.clientX - containerRect.left,
        mouseY: e.clientY - containerRect.top,
      });
    }
  };

  // Update the drawing connection as mouse moves
  const handleMouseMove = (e: React.MouseEvent) => {
    if (drawingConnection && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      setDrawingConnection({
        ...drawingConnection,
        mouseX: e.clientX - containerRect.left,
        mouseY: e.clientY - containerRect.top,
      });
    }
  };

  // Finish drawing a connection
  const handleMouseUp = (e: React.MouseEvent) => {
    if (!drawingConnection) return;
    
    // Find if we're over a target dot
    let targetElement: HTMLDivElement | null = null;
    let targetId: string | null = null;
    
    for (const [id, element] of Object.entries(targetDotsRef.current)) {
      if (!element) continue;
      
      const rect = element.getBoundingClientRect();
      const isOver =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      
      if (isOver) {
        targetElement = element;
        targetId = id;
        break;
      }
    }
    
    // If we found a target and it's not already connected
    if (targetId && !connections.some(conn => conn.targetId === targetId)) {
      // Create a new connection
      const newConnection: Connection = {
        id: `conn-${Date.now()}`,
        sourceId: drawingConnection.source,
        targetId,
      };
      
      setConnections([...connections, newConnection]);
    }
    
    // Reset drawing state
    setDrawingConnection(null);
  };

  // Remove a connection
  const handleRemoveConnection = (connectionId: string) => {
    setConnections(connections.filter(conn => conn.id !== connectionId));
    setHoveredConnection(null);
  };

  // Check if a field is active (has a connection)
  const isFieldActive = (fieldId: string, isSource: boolean) => {
    return connections.some(conn => 
      isSource ? conn.sourceId === fieldId : conn.targetId === fieldId
    );
  };

  return (
    <div 
      ref={containerRef}
      className="p-6 flex gap-6 relative"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => setDrawingConnection(null)}
    >
      {/* Source Fields */}
      <div className="w-1/2 bg-white rounded-lg border overflow-hidden">
        <div className="p-4 border-b flex items-center gap-3">
          <FileText className="text-blue-500 w-6 h-6" />
          <div>
            <h3 className="font-medium text-gray-800">product_catalog_2025.csv</h3>
            <p className="text-sm text-gray-500">CSV, Imported</p>
          </div>
        </div>
        
        <div className="divide-y">
          {/* Header row */}
          <div className="flex px-4 py-3 bg-gray-50 text-gray-600 font-medium">
            <div className="w-1/3">Column name</div>
            <div className="w-2/3">Example content</div>
          </div>
          
          {/* Data rows */}
          {sourceFields.map(field => (
            <div key={field.id} className="flex px-4 py-3 items-center">
              <div className="w-1/3 font-medium text-gray-700">{field.name}</div>
              <div className="w-2/3 text-gray-600 flex justify-between items-center">
                <div className="truncate pr-4">{field.exampleContent}</div>
                <div 
                  ref={el => (sourceDotsRef.current[field.id] = el)}
                  className={`w-4 h-4 rounded-full border-2 border-blue-500 ${
                    isFieldActive(field.id, true) 
                      ? "bg-blue-500" 
                      : "bg-white cursor-pointer"
                  }`}
                  onMouseDown={(e) => {
                    if (!isFieldActive(field.id, true)) {
                      handleDragStart(field.id, e);
                    }
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Target Fields */}
      <div className="w-1/2 space-y-6">
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-medium text-gray-800 mb-1">Poltio Product Data</h3>
          <p className="text-sm text-gray-500">These fields and attributes can be used inside Poltio's widgets</p>
          
          <div className="mt-4 space-y-2">
            {targetFields.map(field => (
              <div 
                key={field.id}
                className={`flex items-center rounded-full border px-2 py-2 ${
                  isFieldActive(field.id, false)
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white text-gray-800 border-gray-200"
                }`}
              >
                <div 
                  ref={el => (targetDotsRef.current[field.id] = el)}
                  className={`w-4 h-4 rounded-full border-2 ${
                    isFieldActive(field.id, false)
                      ? "border-white bg-blue-500"
                      : "border-blue-500 bg-white"
                  } mr-2`}
                />
                <div className="flex-1">{field.name}</div>
                <div className={`text-xs ${isFieldActive(field.id, false) ? "text-blue-100" : "text-gray-500"}`}>
                  {field.required ? "required" : ""}
                </div>
              </div>
            ))}
            
            {/* Add new attribute button */}
            <button className="flex items-center justify-center w-full border border-dashed border-gray-300 rounded-full p-2 text-gray-500 hover:bg-gray-50">
              <Plus className="w-4 h-4 mr-2" />
              Add new attribute
            </button>
          </div>
        </div>
        
        {/* Preview panel */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center">
                <div className="h-1 w-10 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-sm text-blue-500">89% MATCH</span>
                <span className="text-xs text-gray-500 ml-auto">More info</span>
              </div>
              
              <h3 className="font-medium text-gray-800 mt-2">iPhone 15 Pro - Black</h3>
              <p className="text-sm text-gray-600 mt-1">
                General features<br />
                A17 Pro chip with 6-core GPU<br />
                Up to 29 hours video playback<br />
                {/* More text truncated for brevity */}
              </p>
              
              <div className="text-blue-500 font-medium mt-3">€999.00</div>
              
              <button className="mt-3 text-gray-400 hover:text-gray-600">
                See product
              </button>
            </div>
            
            <div className="ml-4">
              <img 
                src="/lovable-uploads/28f3486c-d672-4d5f-aad6-bbb221854306.png" 
                alt="iPhone 15 Pro" 
                className="w-24 h-24 object-contain"
              />
            </div>
          </div>
          
          <button className="w-full mt-4 text-center py-2 text-gray-600 hover:text-gray-800">
            Preview
          </button>
        </div>
      </div>
      
      {/* Connection Lines */}
      <svg 
        className="absolute top-0 left-0 w-full h-full pointer-events-none" 
        style={{ zIndex: 10 }}
      >
        {/* Existing connections */}
        {connections.map(connection => {
          const sourceElement = sourceDotsRef.current[connection.sourceId];
          const targetElement = targetDotsRef.current[connection.targetId];
          
          if (!sourceElement || !targetElement) return null;
          
          const sourcePos = getDotPosition(sourceElement);
          const targetPos = getDotPosition(targetElement);
          
          return (
            <g key={connection.id} 
              className="connection-group"
              onMouseEnter={() => setHoveredConnection(connection.id)}
              onMouseLeave={() => setHoveredConnection(null)}
            >
              <ConnectionLine 
                startX={sourcePos.x}
                startY={sourcePos.y}
                endX={targetPos.x}
                endY={targetPos.y}
                stroke="#3b82f6"
                strokeWidth={2}
              />
              
              {hoveredConnection === connection.id && (
                <foreignObject
                  x={(sourcePos.x + targetPos.x) / 2 - 15}
                  y={(sourcePos.y + targetPos.y) / 2 - 15}
                  width={30}
                  height={30}
                  style={{ pointerEvents: 'auto' }}
                >
                  <div
                    className="w-full h-full bg-white rounded-full shadow-md flex items-center justify-center cursor-pointer"
                    onClick={() => handleRemoveConnection(connection.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </div>
                </foreignObject>
              )}
            </g>
          );
        })}
        
        {/* Drawing connection line */}
        {drawingConnection && (
          <ConnectionLine 
            startX={getDotPosition(sourceDotsRef.current[drawingConnection.source]).x}
            startY={getDotPosition(sourceDotsRef.current[drawingConnection.source]).y}
            endX={drawingConnection.mouseX}
            endY={drawingConnection.mouseY}
            stroke="#3b82f6"
            strokeWidth={2}
            isDashed={true}
          />
        )}
      </svg>
    </div>
  );
};

export default MappingArea;
