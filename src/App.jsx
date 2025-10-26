import { useState, useEffect } from "react";

// Iconos del escritorio
const icons = [
  { id: 1, name: "Mi PC", emoji: "🖥️" },
  { id: 2, name: "Papelera", emoji: "🗑️" },
  { id: 3, name: "Explorador", emoji: "📁" },
];

// Ventana base
function Window({ windowData, onClose, onMinimize, bringToFront, children }) {
  const [pos, setPos] = useState(windowData.pos || { x: 100, y: 100 });
  const [size, setSize] = useState(windowData.size || { width: 400, height: 300 });
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [maximized, setMaximized] = useState(false);
  const [prevPos, setPrevPos] = useState(null);
  const [prevSize, setPrevSize] = useState(null);

  const handleMouseDown = (e) => {
    bringToFront(windowData.id);
    if (!maximized) {
      setDragging(true);
      setOffset({ x: e.clientX - pos.x, y: e.clientY - pos.y });
    }
  };

  const handleMouseMove = (e) => {
    if (dragging) setPos({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseUp = () => setDragging(false);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  });

  const toggleMaximize = () => {
    if (!maximized) {
      setPrevPos(pos);
      setPrevSize(size);
      setPos({ x: 0, y: 0 });
      setSize({ width: window.innerWidth, height: window.innerHeight - 48 });
    } else {
      setPos(prevPos);
      setSize(prevSize);
    }
    setMaximized(!maximized);
  };

  const handleMinimize = () => onMinimize(windowData.id);

  if (windowData.minimized) return null;

  return (
    <div
      className="absolute border border-gray-400 bg-white shadow-lg rounded-lg transition-all"
      style={{ top: pos.y, left: pos.x, width: size.width, height: size.height, zIndex: windowData.zIndex }}
      onMouseDown={() => bringToFront(windowData.id)}
    >
      <div
        className="bg-blue-600 text-white p-2 cursor-move flex justify-between items-center rounded-t-lg"
        onMouseDown={handleMouseDown}
      >
        <span>{windowData.name}</span>
        <div className="flex gap-1">
          <button className="bg-yellow-400 px-2 rounded hover:bg-yellow-500" onClick={handleMinimize}>_</button>
          <button className="bg-green-500 px-2 rounded hover:bg-green-600" onClick={toggleMaximize}>🗖</button>
          <button className="bg-red-500 px-2 rounded hover:bg-red-700" onClick={() => onClose(windowData.id)}>X</button>
        </div>
      </div>
      <div className="p-2 h-full overflow-auto">{children || windowData.content}</div>
    </div>
  );
}

export default function App() {
  const [openWindows, setOpenWindows] = useState([]);
  const [time, setTime] = useState(new Date());
  const [zCounter, setZCounter] = useState(1);
  const [startMenuOpen, setStartMenuOpen] = useState(false);

  const [files, setFiles] = useState([]); // Raíz del sistema de archivos
  const [currentFolderId, setCurrentFolderId] = useState(null); // carpeta actual
  const [trash, setTrash] = useState([]); // Papelera

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Abrir ventana
  const openWindow = (icon) => {
    const exists = openWindows.find((w) => w.id === icon.id);
    if (!exists) {
      setOpenWindows([...openWindows, { ...icon, minimized: false, zIndex: zCounter, pos: { x: 100, y: 100 }, size: { width: 400, height: 300 } }]);
      setZCounter(zCounter + 1);
    } else {
      setOpenWindows(openWindows.map(w => w.id === icon.id ? { ...w, minimized: false, zIndex: zCounter + 1 } : w));
      setZCounter(zCounter + 2);
    }
  };

  const closeWindow = (id) => setOpenWindows(openWindows.filter(w => w.id !== id));
  const minimizeWindow = (id) => setOpenWindows(openWindows.map(w => w.id === id ? { ...w, minimized: true } : w));
  const bringToFront = (id) => {
    const maxZ = Math.max(...openWindows.map(w => w.zIndex || 0), zCounter);
    setOpenWindows(openWindows.map(w => w.id === id ? { ...w, zIndex: maxZ + 1 } : w));
    setZCounter(maxZ + 2);
  };

  // Helper: encontrar carpeta
  const findFolder = (id, arr = files) => {
    for (let f of arr) {
      if (f.id === id && f.type === "folder") return f;
      if (f.type === "folder" && f.children.length) {
        const found = findFolder(id, f.children);
        if (found) return found;
      }
    }
    return null;
  };

  // Helper: encontrar archivo
  const findFile = (id, arr = files) => {
    for (let f of arr) {
      if (f.id === id && f.type === "file") return f;
      if (f.type === "folder" && f.children.length) {
        const found = findFile(id, f.children);
        if (found) return found;
      }
    }
    return null;
  };

  // Crear archivo/carpeta
  const createFile = () => {
    const name = prompt("Nombre del archivo:");
    if (!name) return;
    const newFile = { id: Date.now(), name, type: "file", content: "" };
    if (!currentFolderId) setFiles([...files, newFile]);
    else {
      const folder = findFolder(currentFolderId);
      folder.children.push(newFile);
      setFiles([...files]);
    }
  };

  const createFolder = () => {
    const name = prompt("Nombre de la carpeta:");
    if (!name) return;
    const newFolder = { id: Date.now(), name, type: "folder", children: [] };
    if (!currentFolderId) setFiles([...files, newFolder]);
    else {
      const folder = findFolder(currentFolderId);
      folder.children.push(newFolder);
      setFiles([...files]);
    }
  };

  // Editar archivo
  const editFile = (item) => {
    const newContent = prompt(`Editar ${item.name}:`, item.content || "");
    if (newContent !== null) item.content = newContent;
    setFiles([...files]);
  };

  // Eliminar elemento
  const deleteItem = (item, parentArr = files) => {
    const index = parentArr.findIndex(f => f.id === item.id);
    if (index !== -1) {
      parentArr.splice(index, 1);
      setTrash([...trash, item]);
      setFiles([...files]);
      return true;
    } else {
      for (let f of parentArr.filter(f => f.type === "folder")) {
        if (deleteItem(item, f.children)) return true;
      }
    }
    return false;
  };

  // Mover elemento
  const moveItem = (item, targetFolderId) => {
    deleteItem(item);
    const target = targetFolderId ? findFolder(targetFolderId) : null;
    if (target) target.children.push(item);
    else files.push(item);
    setFiles([...files]);
  };

  const currentFolder = currentFolderId ? findFolder(currentFolderId) : { children: files };

  return (
    <div className="h-screen w-screen bg-gray-800 text-white relative overflow-hidden">
      {/* Escritorio */}
      <div className="p-4 flex flex-wrap gap-4">
        {icons.map((icon) => (
          <div key={icon.id} className="flex flex-col items-center cursor-pointer hover:scale-110 transition-transform" onDoubleClick={() => openWindow(icon)}>
            <div className="text-4xl">{icon.emoji}</div>
            <span>{icon.name}</span>
          </div>
        ))}
      </div>

      {/* Ventanas abiertas */}
      {openWindows.map(win => {
        if (win.name === "Explorador") {
          return (
            <Window key={win.id} windowData={win} onClose={closeWindow} onMinimize={minimizeWindow} bringToFront={bringToFront}>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2 mb-2">
                  <button className="bg-green-600 px-2 py-1 rounded hover:bg-green-700" onClick={createFile}>Nuevo archivo</button>
                  <button className="bg-blue-600 px-2 py-1 rounded hover:bg-blue-700" onClick={createFolder}>Nueva carpeta</button>
                  {currentFolderId && <button className="bg-gray-500 px-2 py-1 rounded hover:bg-gray-600" onClick={() => setCurrentFolderId(null)}>.. Subir</button>}
                </div>
                {currentFolder.children.length === 0 && <p>Carpeta vacía.</p>}
                {currentFolder.children.map(item => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center bg-gray-700 px-2 py-1 rounded"
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", item.id)}
                    onDragOver={(e) => { if (item.type === "folder") e.preventDefault(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const draggedId = parseInt(e.dataTransfer.getData("text/plain"));
                      const draggedItem = findFolder(draggedId) || findFile(draggedId);
                      if (draggedItem && item.type === "folder") moveItem(draggedItem, item.id);
                    }}
                  >
                    <span className="cursor-pointer hover:underline" onClick={() => item.type === "folder" ? setCurrentFolderId(item.id) : editFile(item)}>
                      {item.type === "folder" ? "📁 " : "📄 "} {item.name}
                    </span>
                    <div className="flex gap-1">
                      <button className="bg-red-500 px-2 rounded hover:bg-red-700" onClick={() => deleteItem(item)}>X</button>
                    </div>
                  </div>
                ))}
              </div>
            </Window>
          );
        }

        if (win.name === "Papelera") {
          return (
            <Window key={win.id} windowData={win} onClose={closeWindow} onMinimize={minimizeWindow} bringToFront={bringToFront}>
              <div className="flex flex-col gap-2">
                {trash.length === 0 && <p>Papelera vacía.</p>}
                {trash.map(item => (
                  <div key={item.id} className="flex justify-between items-center bg-gray-700 px-2 py-1 rounded">
                    <span>{item.type === "folder" ? "📁 " : "📄 "} {item.name}</span>
                    <div className="flex gap-1">
                      <button className="bg-green-600 px-2 rounded hover:bg-green-700" onClick={() => { moveItem(item, null); setTrash(trash.filter(t => t.id !== item.id)); }}>Restaurar</button>
                      <button className="bg-red-500 px-2 rounded hover:bg-red-700" onClick={() => setTrash(trash.filter(t => t.id !== item.id))}>Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            </Window>
          );
        }

        return <Window key={win.id} windowData={win} onClose={closeWindow} onMinimize={minimizeWindow} bringToFront={bringToFront}>{win.content}</Window>;
      })}

      {/* Barra de tareas */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gray-900 flex justify-between items-center px-2">
        <div className="relative">
          <button className="bg-gray-700 px-4 py-1 rounded hover:bg-gray-600" onClick={() => setStartMenuOpen(!startMenuOpen)}>Inicio</button>
          {startMenuOpen && (
            <div className="absolute bottom-12 left-0 w-48 bg-gray-700 rounded shadow-lg p-2 flex flex-col gap-2">
              <button
                className="hover:bg-gray-600 p-1 rounded"
                onClick={() => {
                  // Salir: cierra ventanas y resetea carpeta
                  setOpenWindows([]);
                  setCurrentFolderId(null);
                  setStartMenuOpen(false);
                }}
              >
                Salir
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {openWindows.map(w => (
            <button
              key={w.id}
              className={`px-3 py-1 rounded hover:bg-gray-700 ${w.minimized ? "bg-gray-600" : "bg-gray-800"}`}
              onClick={() => setOpenWindows(openWindows.map(win => win.id === w.id ? { ...win, minimized: !win.minimized } : win))}
            >
              {w.name}
            </button>
          ))}
        </div>

        <div className="text-white px-2">{time.toLocaleTimeString()}</div>
      </div>
    </div>
  );
}