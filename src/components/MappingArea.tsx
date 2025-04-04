import React, { useState, useRef, useEffect } from "react";
import { FileText, Plus, Trash2, ChevronDown } from "lucide-react";
import ConnectionLine from "./ConnectionLine";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface Field {
  id: string;
  name: string;
  exampleContent?: string;
  required?: boolean;
  active?: boolean;
}

interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
}

interface ConnectedFields {
  [key: string]: boolean;
}

const MappingArea: React.FC = () => {
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

  const targetFields: Field[] = [
    { id: "id", name: "ID", required: true },
    { id: "product-name", name: "Product Name", required: true },
    { id: "product-url", name: "Product URL", required: true },
    { id: "image", name: "Image", required: true },
    { id: "description", name: "Description" },
    { id: "price", name: "Price" },
  ];

  const [connections, setConnections] = useState<Connection[]>([]);
  const [drawingConnection, setDrawingConnection] = useState<{
    source: string;
    mouseX: number;
    mouseY: number;
  } | null>(null);
  const sourceDotsRef = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const targetDotsRef = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const targetFieldRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredConnection, setHoveredConnection] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [connectionToRemove, setConnectionToRemove] = useState<string | null>(null);
  const [activeSourceForDropdown, setActiveSourceForDropdown] = useState<string | null>(null);
  const [helperTextPosition, setHelperTextPosition] = useState<{x: number, y: number} | null>(null);
  const [nearbyInactiveDot, setNearbyInactiveDot] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [connectedFields, setConnectedFields] = useState<ConnectedFields>({});
  const [hoveredTargetField, setHoveredTargetField] = useState<string | null>(null);

  useEffect(() => {
    const initialConnections = [
      { id: "conn-1", sourceId: "sku-id", targetId: "id" },
      { id: "conn-2", sourceId: "title", targetId: "product-name" },
      { id: "conn-3", sourceId: "url", targetId: "product-url" },
    ];
    
    setConnections(initialConnections);
    
    const initialFieldsState: ConnectedFields = {};
    initialConnections.forEach(conn => {
      initialFieldsState[conn.targetId] = true;
    });
    
    setConnectedFields(initialFieldsState);
  }, []);

  const getDotPosition = (element: HTMLDivElement | null) => {
    if (!element || !containerRef.current) return { x: 0, y: 0 };
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    
    return {
      x: rect.left + rect.width / 2 - containerRect.left,
      y: rect.top + rect.height / 2 - containerRect.top,
    };
  };

  const handleDragStart = (sourceId: string, e: React.MouseEvent) => {
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

      setIsDragging(true);
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
      
      setHelperTextPosition(null);
      setNearbyInactiveDot(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (drawingConnection && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      setDrawingConnection({
        ...drawingConnection,
        mouseX: e.clientX - containerRect.left,
        mouseY: e.clientY - containerRect.top,
      });
      
      let foundHoveredField = false;
      
      for (const [id, element] of Object.entries(targetFieldRefs.current)) {
        if (!element || connections.some(conn => conn.targetId === id)) continue;
        
        const rect = element.getBoundingClientRect();
        const isOver =
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom;
        
        if (isOver) {
          setHoveredTargetField(id);
          foundHoveredField = true;
          break;
        }
      }
      
      if (!foundHoveredField) {
        setHoveredTargetField(null);
      }
    } else if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - containerRect.left;
      const mouseY = e.clientY - containerRect.top;
      
      let foundNearbyDot = false;
      for (const [id, element] of Object.entries(sourceDotsRef.current)) {
        if (!element || connections.some(conn => conn.sourceId === id)) continue;
        
        const pos = getDotPosition(element);
        const distance = Math.sqrt(Math.pow(mouseX - pos.x, 2) + Math.pow(mouseY - pos.y, 2));
        
        if (distance <= 20) {
          setHelperTextPosition({ x: mouseX, y: mouseY });
          setNearbyInactiveDot(id);
          foundNearbyDot = true;
          break;
        }
      }
      
      if (!foundNearbyDot) {
        for (const [id, element] of Object.entries(targetDotsRef.current)) {
          if (!element || connections.some(conn => conn.targetId === id)) continue;
          
          const pos = getDotPosition(element);
          const distance = Math.sqrt(Math.pow(mouseX - pos.x, 2) + Math.pow(mouseY - pos.y, 2));
          
          if (distance <= 20) {
            setHelperTextPosition({ x: mouseX, y: mouseY });
            setNearbyInactiveDot(id);
            foundNearbyDot = true;
            break;
          }
        }
      }
      
      if (!foundNearbyDot) {
        setHelperTextPosition(null);
        setNearbyInactiveDot(null);
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!drawingConnection) return;
    
    let targetId: string | null = null;
    
    if (hoveredTargetField) {
      targetId = hoveredTargetField;
    } else {
      for (const [id, element] of Object.entries(targetFieldRefs.current)) {
        if (!element || connections.some(conn => conn.targetId === id)) continue;
        
        const rect = element.getBoundingClientRect();
        const isOver =
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom;
        
        if (isOver) {
          targetId = id;
          break;
        }
      }
      
      if (!targetId) {
        for (const [id, element] of Object.entries(targetDotsRef.current)) {
          if (!element || connections.some(conn => conn.targetId === id)) continue;
          
          const rect = element.getBoundingClientRect();
          const isOver =
            e.clientX >= rect.left - 10 &&
            e.clientX <= rect.right + 10 &&
            e.clientY >= rect.top - 10 &&
            e.clientY <= rect.bottom + 10;
          
          if (isOver) {
            targetId = id;
            break;
          }
        }
      }
    }
    
    if (targetId && !connections.some(conn => conn.targetId === targetId)) {
      const newConnection: Connection = {
        id: `conn-${Date.now()}`,
        sourceId: drawingConnection.source,
        targetId,
      };
      
      setConnections([...connections, newConnection]);
      
      setConnectedFields(prev => ({
        ...prev,
        [targetId]: true
      }));
    }
    
    setDrawingConnection(null);
    setHoveredTargetField(null);
    
    if (isDragging) {
      setIsDragging(false);
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    }
  };

  const handleMouseLeave = () => {
    setDrawingConnection(null);
    setHelperTextPosition(null);
    setNearbyInactiveDot(null);
    setHoveredTargetField(null);
    
    if (isDragging) {
      setIsDragging(false);
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    }
  };

  const handleDotClick = (fieldId: string, isSource: boolean) => {
    const existingConnection = connections.find(conn => 
      isSource ? conn.sourceId === fieldId : conn.targetId === fieldId
    );

    if (existingConnection) {
      setConnectionToRemove(existingConnection.id);
      setConfirmDialogOpen(true);
    } else if (isSource) {
      setActiveSourceForDropdown(fieldId);
    }
  };

  const handleCreateConnectionFromDropdown = (sourceId: string, targetId: string) => {
    if (!connections.some(conn => conn.targetId === targetId)) {
      const newConnection: Connection = {
        id: `conn-${Date.now()}`,
        sourceId,
        targetId,
      };
      
      setConnections([...connections, newConnection]);
      
      setConnectedFields(prev => ({
        ...prev,
        [targetId]: true
      }));
    }
    
    setActiveSourceForDropdown(null);
  };

  const handleRemoveConnection = (connectionId: string) => {
    const connectionToRemove = connections.find(conn => conn.id === connectionId);
    
    if (connectionToRemove) {
      setConnectedFields(prev => ({
        ...prev,
        [connectionToRemove.targetId]: false
      }));
    }
    
    setConnections(connections.filter(conn => conn.id !== connectionId));
    setHoveredConnection(null);
    setConnectionToRemove(null);
    setConfirmDialogOpen(false);
  };

  const isFieldActive = (fieldId: string, isSource: boolean) => {
    return connections.some(conn => 
      isSource ? conn.sourceId === fieldId : conn.targetId === fieldId
    );
  };

  const getAvailableTargetFields = () => {
    const connectedTargetIds = connections.map(conn => conn.targetId);
    return targetFields.filter(field => !connectedTargetIds.includes(field.id));
  };

  const getDotCursorStyle = (fieldId: string, isSource: boolean) => {
    const hasConnection = isFieldActive(fieldId, isSource);
    
    if (hasConnection) {
      return "cursor-pointer";
    } else if (drawingConnection && drawingConnection.source === fieldId) {
      return "cursor-grabbing";
    } else {
      return "cursor-grab";
    }
  };

  const isTargetFieldConnected = (fieldId: string) => {
    return connections.some(conn => conn.targetId === fieldId);
  };

  const getFieldAnimationClass = (fieldId: string) => {
    const isConnected = connectedFields[fieldId];
    
    if (isConnected === undefined) {
      return "";
    } else if (isConnected) {
      return "animate-connection-added";
    } else {
      return "animate-connection-removed";
    }
  };

  return (
    <div 
      ref={containerRef}
      className="p-6 flex gap-6 relative"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <div className="w-[40%] bg-white rounded-lg border overflow-hidden">
        <div className="p-4 border-b flex items-center gap-3">
          <FileText className="text-blue-500 w-6 h-6" />
          <div>
            <h3 className="font-medium text-gray-800">product_catalog_2025.csv</h3>
            <p className="text-sm text-gray-500">CSV, Imported</p>
          </div>
        </div>
        
        <div className="divide-y">
          <div className="flex px-4 py-3 bg-gray-50 text-gray-600 font-medium">
            <div className="w-1/3">Column name</div>
            <div className="w-2/3">Example content</div>
          </div>
          
          {sourceFields.map(field => (
            <div key={field.id} className="flex px-4 py-3 items-center">
              <div className="w-1/3 font-medium text-gray-700">{field.name}</div>
              <div className="w-2/3 text-gray-600 flex justify-between items-center">
                <div className="truncate pr-4">{field.exampleContent}</div>
                <div className="relative">
                  <div 
                    ref={el => (sourceDotsRef.current[field.id] = el)}
                    className={`w-4 h-4 rounded-full border-2 border-blue-500 ${
                      isFieldActive(field.id, true) 
                        ? "bg-blue-500" 
                        : "bg-white"
                    } ${getDotCursorStyle(field.id, true)}`}
                    onMouseDown={(e) => {
                      if (!isFieldActive(field.id, true)) {
                        handleDragStart(field.id, e);
                      }
                    }}
                    onClick={() => handleDotClick(field.id, true)}
                  />
                  
                  {activeSourceForDropdown === field.id && (
                    <DropdownMenu open={true} onOpenChange={(open) => {
                      if (!open) setActiveSourceForDropdown(null);
                    }}>
                      <DropdownMenuTrigger asChild>
                        <div />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent 
                        className="w-48" 
                        align="end" 
                        side="right"
                        style={{ 
                          position: 'absolute', 
                          top: '0', 
                          right: '24px',
                          zIndex: 20 
                        }}
                      >
                        {getAvailableTargetFields().length === 0 ? (
                          <div className="px-2 py-1 text-sm text-gray-500">
                            No available targets
                          </div>
                        ) : (
                          getAvailableTargetFields().map(targetField => (
                            <DropdownMenuItem 
                              key={targetField.id}
                              onClick={() => handleCreateConnectionFromDropdown(field.id, targetField.id)}
                            >
                              {targetField.name}
                              {targetField.required && (
                                <span className="text-xs text-gray-500 ml-1">(required)</span>
                              )}
                            </DropdownMenuItem>
                          ))
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="w-[30%] space-y-6">
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-medium text-gray-800 mb-1">Poltio Product Data</h3>
          <p className="text-sm text-gray-500">These fields and attributes can be used inside Poltio's widgets</p>
          
          <div className="mt-4 space-y-2">
            {targetFields.map(field => (
              <div 
                key={field.id}
                ref={el => (targetFieldRefs.current[field.id] = el)}
                className={`flex items-center rounded-full border px-2 py-2 ${
                  isFieldActive(field.id, false)
                    ? "bg-blue-500 text-white border-blue-500"
                    : hoveredTargetField === field.id
                    ? "bg-gray-100 text-gray-800 border-gray-200"
                    : "bg-white text-gray-800 border-gray-200"
                } transition-colors`}
              >
                <div 
                  ref={el => (targetDotsRef.current[field.id] = el)}
                  className={`w-4 h-4 rounded-full border-2 ${
                    isFieldActive(field.id, false)
                      ? "border-white bg-blue-500"
                      : "border-blue-500 bg-white"
                  } mr-2 ${getDotCursorStyle(field.id, false)}`}
                  onClick={() => handleDotClick(field.id, false)}
                />
                <div className="flex-1">{field.name}</div>
                <div className={`text-xs ${isFieldActive(field.id, false) ? "text-blue-100" : "text-gray-500"}`}>
                  {field.required ? "required" : ""}
                </div>
              </div>
            ))}
            
            <button className="flex items-center justify-center w-full border border-dashed border-gray-300 rounded-full p-2 text-gray-500 hover:bg-gray-50">
              <Plus className="w-4 h-4 mr-2" />
              Add new attribute
            </button>
          </div>
        </div>
      </div>
      
      <div className="w-[30%] space-y-6">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex flex-col">
            <div className="w-full mb-4">
              <div className={`w-full aspect-[16/10] ${getFieldAnimationClass("image")}`}>
                {isTargetFieldConnected("image") ? (
                  <img 
                    src="https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-storage-select-202309-6-1inch-blacktitanium?wid=1280&hei=720&fmt=p-jpg&qlt=80&.v=1692854439854" 
                    alt="iPhone 15 Pro" 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                    [Image]
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center mb-2">
              <div className="h-1 w-10 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-sm text-blue-500">89% MATCH</span>
              <span className="text-xs text-gray-500 ml-auto">More info</span>
            </div>
            
            <div>
              <h3 className={`font-medium text-gray-800 ${getFieldAnimationClass("product-name")}`}>
                {isTargetFieldConnected("product-name") ? (
                  "iPhone 15 Pro - Black"
                ) : (
                  <span className="text-gray-400">[Product Name]</span>
                )}
              </h3>
              
              <p className={`text-sm text-gray-600 mt-1 ${getFieldAnimationClass("description")}`}>
                {isTargetFieldConnected("description") ? (
                  <>
                    General features<br />
                    A17 Pro chip with 6-core GPU<br />
                    Up to 29 hours video playback
                  </>
                ) : (
                  <span className="text-gray-400">[Description]</span>
                )}
              </p>
              
              <div className={`mt-3 ${getFieldAnimationClass("price")} ${isTargetFieldConnected("price") ? "text-blue-500 font-medium" : "text-gray-400"}`}>
                {isTargetFieldConnected("price") ? "€999.00" : "[Price]"}
              </div>
              
              <button 
                className={`mt-3 ${getFieldAnimationClass("product-url")} ${isTargetFieldConnected("product-url") ? "text-blue-500 hover:text-blue-600" : "text-gray-400"}`}
                disabled={!isTargetFieldConnected("product-url")}
              >
                See product
              </button>
            </div>
          </div>
          
          <button className="w-full mt-4 text-center py-2 text-gray-600 hover:text-gray-800">
            Preview
          </button>
        </div>
      </div>
      
      <svg 
        className="absolute top-0 left-0 w-full h-full pointer-events-none" 
        style={{ zIndex: 10 }}
      >
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
              style={{ pointerEvents: 'auto' }}
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

      {helperTextPosition && (
        <div
          className="absolute text-xs text-gray-500 pointer-events-none"
          style={{
            left: `${helperTextPosition.x}px`,
            top: `${helperTextPosition.y + 20}px`,
            transform: 'translateX(-50%)',
            zIndex: 20,
          }}
        >
          drag to connect
        </div>
      )}

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Connection?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this connection? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => connectionToRemove && handleRemoveConnection(connectionToRemove)}
              className="bg-red-500 hover:bg-red-600"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MappingArea;
