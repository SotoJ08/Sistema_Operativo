import { useEffect, useMemo, useRef, useState } from "react";
import Draggable from "react-draggable"; 

/* =========================
   Parámetros “de sistema”
   ========================= */
const DEFAULT_USER = "admin";
const DEFAULT_PASS = "1234";
const DEVICE_NAME = "MSI-USER";
const SYSTEM_INFO = {
  ram: "16 GB",
  storage: "1 TB NVMe SSD",
  cpu: "Intel® Core™ i7-12700H (12ª generación)",
  device: DEVICE_NAME,
};

const DESKTOP_ICONS = [
  { id: 1, name: "Mi PC", emoji: "🖥️" },
  { id: 2, name: "Papelera", emoji: "🗑️" },
  { id: 3, name: "Explorador", emoji: "📁" },
  { id: 4, name: "Procesos", emoji: "📊" },
];

/* ================
   Ventana base
   ================ */
function Window({ windowData, onClose, onMinimize, bringToFront, children }) {
  const [pos, setPos] = useState(windowData.pos || { x: 140, y: 110 });
  const [size, setSize] = useState(windowData.size || { width: 480, height: 360 });
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [maximized, setMaximized] = useState(false);
  const [prevPos, setPrevPos] = useState(null);
  const [prevSize, setPrevSize] = useState(null);

  const startDrag = (e) => {
    bringToFront(windowData.id);
    if (!maximized) {
      setDragging(true);
      setOffset({ x: e.clientX - pos.x, y: e.clientY - pos.y });
    }
  };
  const onMove = (e) => {
    if (dragging) setPos({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };
  const stopDrag = () => setDragging(false);

  useEffect(() => {
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", stopDrag);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", stopDrag);
    };
  });

  const toggleMaximize = () => {
    if (!maximized) {
      setPrevPos(pos);
      setPrevSize(size);
      setPos({ x: 0, y: 0 });
      setSize({ width: window.innerWidth, height: window.innerHeight - 64 }); // deja espacio a la barra
    } else {
      if (prevPos) setPos(prevPos);
      if (prevSize) setSize(prevSize);
    }
    setMaximized(!maximized);
  };

  if (windowData.minimized) return null;

  return (
    <div
      className="absolute border border-white/30 rounded-xl shadow-xl backdrop-blur-md bg-white/40 transition-all overflow-hidden"
      style={{ top: pos.y, left: pos.x, width: size.width, height: size.height, zIndex: windowData.zIndex }}
      onMouseDown={() => bringToFront(windowData.id)}
    >
      <div
        className="bg-gradient-to-r from-blue-600/90 to-blue-400/90 text-white font-semibold p-2 cursor-move flex justify-between items-center rounded-t-xl select-none"
        onMouseDown={startDrag}
      >
        <span className="truncate">{windowData.name}</span>
        <div className="flex gap-1">
          <button
            className="bg-yellow-400/90 px-2 rounded hover:bg-yellow-500"
            onClick={() => onMinimize(windowData.id)}
            title="Minimizar"
          >
            _
          </button>
          <button
            className="bg-green-500/90 px-2 rounded hover:bg-green-600"
            onClick={toggleMaximize}
            title="Maximizar"
          >
            🗖
          </button>
          <button
            className="bg-red-500/90 px-2 rounded hover:bg-red-700"
            onClick={() => onClose(windowData.id)}
            title="Cerrar"
          >
            X
          </button>
        </div>
      </div>
      <div className="p-3 h-full overflow-auto">{children}</div>
    </div>
  );
}

/* =======================
   Contenidos de ventanas
   ======================= */
function ThisPC() {
  return (
    <div className="space-y-3 text-gray-900">
      <h2 className="text-xl font-bold text-blue-800">Información del sistema</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InfoCard label="Nombre del equipo" value={SYSTEM_INFO.device} />
        <InfoCard label="Procesador" value={SYSTEM_INFO.cpu} />
        <InfoCard label="Memoria instalada (RAM)" value={SYSTEM_INFO.ram} />
        <InfoCard label="Almacenamiento" value={SYSTEM_INFO.storage} />
      </div>
      <p className="text-sm text-gray-700">
        Sistema operativo simulado (React + Tailwind, estilo Aero/Windows Vista).
      </p>
    </div>
  );
}
const InfoCard = ({ label, value }) => (
  <div className="rounded-lg bg-white/70 backdrop-blur p-3 shadow border border-gray-200">
    <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
    <div className="text-base font-semibold text-gray-900">{value}</div>
  </div>
);

/* Explorador con botón Atrás (historial) */
function Explorer({
  currentFolder,
  canGoBack,
  goBack,
  setCurrentFolderId,
  createFile,
  createFolder,
  editFile,
  deleteItem,
  moveItem,
  findFolder,
  findFile,
}) {
  return (
    <div className="flex flex-col gap-2 text-gray-900">
      <div className="flex items-center gap-2 mb-2">
        <button
          className={`px-3 py-1 rounded bg-gray-300 hover:bg-gray-400 disabled:opacity-40 disabled:cursor-not-allowed`}
          onClick={goBack}
          disabled={!canGoBack}
          title="Atrás"
        >
          ← Atrás
        </button>
        <button className="bg-green-600/80 text-white px-2 py-1 rounded hover:bg-green-700" onClick={createFile}>
          Nuevo archivo
        </button>
        <button className="bg-blue-600/80 text-white px-2 py-1 rounded hover:bg-blue-700" onClick={createFolder}>
          Nueva carpeta
        </button>
        {currentFolder?.up && (
          <button className="bg-gray-500/80 text-white px-2 py-1 rounded hover:bg-gray-600" onClick={() => setCurrentFolderId(currentFolder.up)}>
            ⬆ Subir
          </button>
        )}
      </div>
      {currentFolder.children.length === 0 && <p className="text-gray-700">Carpeta vacía.</p>}
      {currentFolder.children.map((item) => (
        <div
          key={item.id}
          className="flex justify-between items-center bg-gray-700/60 px-3 py-1 rounded-lg backdrop-blur-sm text-white"
          draggable
          onDragStart={(e) => e.dataTransfer.setData("text/plain", String(item.id))}
          onDragOver={(e) => {
            if (item.type === "folder") e.preventDefault();
          }}
          onDrop={(e) => {
            e.preventDefault();
            const draggedId = parseInt(e.dataTransfer.getData("text/plain"));
            const draggedItem = findFolder(draggedId) || findFile(draggedId);
            if (draggedItem && item.type === "folder") moveItem(draggedItem, item.id);
          }}
        >
          <span className="cursor-pointer hover:underline" onClick={() => (item.type === "folder" ? setCurrentFolderId(item.id) : editFile(item))}>
            {item.type === "folder" ? "📁" : "📄"} {item.name}
          </span>
          <button className="bg-red-500/80 px-2 rounded hover:bg-red-700" onClick={() => deleteItem(item)}>
            Eliminar
          </button>
        </div>
      ))}
    </div>
  );
}

/* Papelera con “Atrás” (vuelve a escritorio cerrando) */
function RecycleBin({ trash, goBack, hasBack, restore, remove, empty }) {
  return (
    <div className="flex flex-col gap-2 text-gray-900">
      <div className="mb-2">
        <button
          className="px-3 py-1 rounded bg-gray-300 hover:bg-gray-400 disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={goBack}
          disabled={!hasBack}
          title="Atrás"
        >
          ← Atrás
        </button>
      </div>
      {trash.length === 0 && <p className="text-gray-700">Papelera vacía.</p>}
      {trash.map((item) => (
        <div key={item.id} className="flex justify-between items-center bg-gray-700/60 px-3 py-1 rounded-lg backdrop-blur-sm text-white">
          <span>{item.type === "folder" ? "📁" : "📄"} {item.name}</span>
          <div className="flex gap-1">
            <button className="bg-green-600/80 px-2 rounded hover:bg-green-700" onClick={() => restore(item)}>
              Restaurar
            </button>
            <button className="bg-red-500/80 px-2 rounded hover:bg-red-700" onClick={() => remove(item)}>
              Eliminar
            </button>
          </div>
        </div>
      ))}
      {trash.length > 0 && (
        <button className="self-start bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700" onClick={empty}>
          Vaciar papelera
        </button>
      )}
    </div>
  );
}

/* Visor de procesos */
function ProcessViewer({ processes, kill }) {
  return (
    <div className="space-y-2 text-gray-900">
      <div className="text-blue-900 font-bold text-lg">Procesos (simulado)</div>
      <div className="grid grid-cols-12 text-xs font-semibold text-gray-600 bg-white/70 rounded-lg overflow-hidden">
        <div className="col-span-6 px-2 py-1">Nombre</div>
        <div className="col-span-2 px-2 py-1 text-right">CPU %</div>
        <div className="col-span-2 px-2 py-1 text-right">Mem %</div>
        <div className="col-span-2 px-2 py-1 text-center">Acción</div>
      </div>
      <div className="space-y-1">
        {processes.map((p) => (
          <div key={p.pid} className="grid grid-cols-12 items-center bg-white/70 rounded-lg">
            <div className="col-span-6 px-2 py-1 text-gray-900">{p.name}</div>
            <div className="col-span-2 px-2 py-1 text-right text-gray-900">{p.cpu.toFixed(1)}</div>
            <div className="col-span-2 px-2 py-1 text-right text-gray-900">{p.mem.toFixed(1)}</div>
            <div className="col-span-2 px-2 py-1 text-center">
              <button className="bg-red-500/90 text-white text-xs px-2 py-1 rounded hover:bg-red-600" onClick={() => kill(p.pid)}>
                Finalizar
              </button>
            </div>
          </div>
        ))}
      </div>
      {processes.length === 0 && <div className="text-gray-700">No hay procesos.</div>}
    </div>
  );
}

/* ===========
   Login
   =========== */
function LoginScreen({ onLogin }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (user === DEFAULT_USER && pass === DEFAULT_PASS) onLogin(user);
    else setErr("Usuario o contraseña incorrectos");
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 flex items-center justify-center">
      <div className="w-full max-w-sm bg-white/20 backdrop-blur-xl rounded-2xl border border-white/30 shadow-2xl p-6 text-white">
        <div className="text-center mb-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-white/30 backdrop-blur flex items-center justify-center shadow">
            <span className="text-2xl">👤</span>
          </div>
          <h1 className="text-2xl font-bold mt-2">Bienvenido</h1>
          <p className="text-white/90 text-sm">Inicia sesión para continuar</p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input
            className="w-full px-3 py-2 rounded bg-white/80 text-gray-900 outline-none focus:ring-2 ring-blue-300"
            placeholder="Usuario"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            autoFocus
          />
          <input
            type="password"
            className="w-full px-3 py-2 rounded bg-white/80 text-gray-900 outline-none focus:ring-2 ring-blue-300"
            placeholder="Contraseña"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />
          {err && <div className="text-red-200 text-sm">{err}</div>}
          <button
            type="submit"
            className="w-full py-2 rounded bg-gradient-to-r from-blue-500 to-blue-400 hover:brightness-110 font-semibold shadow"
          >
            Iniciar sesión
          </button>
        </form>
      </div>
    </div>
  );
}

/* =======================
   Miniaturas (Taskbar)
   ======================= */
// Render “mini” de cada tipo usando el mismo estado (vivo)
function MiniPreview({ win, type, state }) {
  // Contenedor 200x130 con escala interna para que “quepa”
  return (
    <div
      className="pointer-events-auto w-[200px] h-[130px] rounded-xl bg-white/70 backdrop-blur shadow-xl border border-white/30 overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-2 py-1 text-xs font-semibold text-gray-800 flex justify-between">
        <span className="truncate">{win.name}</span>
        <button
          className="text-red-600 hover:text-red-700"
          onClick={(e) => {
            e.stopPropagation();
            state.closeWindow(win.id);
          }}
          title="Cerrar"
        >
          ✖
        </button>
      </div>
      <div className="w-full h-[100px] px-2 pb-2">
        <div className="w-full h-full rounded-lg bg-white/80 overflow-hidden">
          {/* Contenido “mini” según tipo */}
          <div className="w-full h-full text-[10px] leading-tight text-gray-900 p-2 overflow-hidden">
            {type === "Mi PC" && (
              <div>
                <div className="font-bold text-blue-800 mb-1">Sistema</div>
                <div>Equipo: {SYSTEM_INFO.device}</div>
                <div>CPU: {SYSTEM_INFO.cpu}</div>
                <div>RAM: {SYSTEM_INFO.ram}</div>
              </div>
            )}
            {type === "Explorador" && (
              <div>
                <div className="font-bold text-blue-800 mb-1">Explorador</div>
                {state.currentFolder.children.slice(0, 5).map((x) => (
                  <div key={x.id} className="truncate">
                    {x.type === "folder" ? "📁" : "📄"} {x.name}
                  </div>
                ))}
                {state.currentFolder.children.length === 0 && <div>(Carpeta vacía)</div>}
              </div>
            )}
            {type === "Papelera" && (
              <div>
                <div className="font-bold text-blue-800 mb-1">Papelera</div>
                {state.trash.slice(0, 5).map((x) => (
                  <div key={x.id} className="truncate">
                    {x.type === "folder" ? "📁" : "📄"} {x.name}
                  </div>
                ))}
                {state.trash.length === 0 && <div>(Vacía)</div>}
              </div>
            )}
            {type === "Procesos" && (
              <div>
                <div className="font-bold text-blue-800 mb-1">Procesos</div>
                {state.processes.slice(0, 4).map((p) => (
                  <div key={p.pid} className="flex justify-between">
                    <span className="truncate">{p.name}</span>
                    <span>{p.cpu.toFixed(1)}%</span>
                  </div>
                ))}
                {state.processes.length === 0 && <div>(Sin procesos)</div>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =======
   APP
   ======= */
export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [sessionUser, setSessionUser] = useState(null);

  const [openWindows, setOpenWindows] = useState([]);
  const [zCounter, setZCounter] = useState(1);
  const [startMenuOpen, setStartMenuOpen] = useState(false);

  // Archivos
  const [files, setFiles] = useState([]);
  const [parentMap, setParentMap] = useState({});
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [explorerBackStack, setExplorerBackStack] = useState([]); // historial para “Atrás”
  // Papelera
  const [trash, setTrash] = useState([]);
  const [recycleCanGoBack, setRecycleCanGoBack] = useState(true); // botón Atrás: vuelve cerrando

  // Reloj
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  // Procesos simulados
  const [processes, setProcesses] = useState(() => [
    { pid: 101, name: "Explorer.exe", cpu: 1.2, mem: 2.4 },
    { pid: 102, name: "SearchIndexer.exe", cpu: 0.8, mem: 1.3 },
    { pid: 103, name: "ReactApp.exe", cpu: 3.5, mem: 5.2 },
  ]);
  useEffect(() => {
    const intv = setInterval(() => {
      setProcesses((prev) =>
        prev.map((p) => ({
          ...p,
          cpu: Math.max(0, Math.min(100, p.cpu + (Math.random() - 0.5) * 2)),
          mem: Math.max(0, Math.min(100, p.mem + (Math.random() - 0.5) * 1)),
        }))
      );
    }, 1200);
    return () => clearInterval(intv);
  }, []);
  const killProcess = (pid) => setProcesses((prev) => prev.filter((p) => p.pid !== pid));

  /* ----- Ventanas ----- */
  const bringToFront = (id) => {
    const maxZ = Math.max(...openWindows.map((w) => w.zIndex || 0), zCounter);
    setOpenWindows(openWindows.map((w) => (w.id === id ? { ...w, zIndex: maxZ + 1 } : w)));
    setZCounter(maxZ + 2);
  };
  const minimizeWindow = (id) =>
    setOpenWindows(openWindows.map((w) => (w.id === id ? { ...w, minimized: true } : w)));
  const closeWindow = (id) => setOpenWindows(openWindows.filter((w) => w.id !== id));

  const openWindowByIcon = (icon) => {
    const exists = openWindows.find((w) => w.id === icon.id);
    if (!exists) {
      setOpenWindows([
        ...openWindows,
        {
          ...icon,
          minimized: false,
          zIndex: zCounter,
          pos: { x: 160, y: 120 },
          size: { width: 500, height: 360 },
        },
      ]);
      setZCounter(zCounter + 1);
    } else {
      setOpenWindows(openWindows.map((w) => (w.id === icon.id ? { ...w, minimized: false, zIndex: zCounter + 1 } : w)));
      setZCounter(zCounter + 2);
    }
  };

  /* ----- Archivos helpers ----- */
  const rebuildParentMap = (arr = files, parent = null, map = {}) => {
    arr.forEach((it) => {
      map[it.id] = parent;
      if (it.type === "folder") rebuildParentMap(it.children, it.id, map);
    });
    return map;
  };
  useEffect(() => {
    setParentMap(rebuildParentMap(files));
  }, [files]);

  const findFolder = (id, arr = files) => {
    for (const f of arr) {
      if (f.id === id && f.type === "folder") return f;
      if (f.type === "folder") {
        const found = findFolder(id, f.children);
        if (found) return found;
      }
    }
    return null;
  };
  const findFile = (id, arr = files) => {
    for (const f of arr) {
      if (f.id === id && f.type === "file") return f;
      if (f.type === "folder") {
        const found = findFile(id, f.children);
        if (found) return found;
      }
    }
    return null;
  };

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
  const editFile = (item) => {
    const newContent = prompt(`Editar ${item.name}:`, item.content || "");
    if (newContent !== null) {
      item.content = newContent;
      setFiles([...files]);
    }
  };
  const removeFromTree = (item, arr = files) => {
    const idx = arr.findIndex((x) => x.id === item.id);
    if (idx !== -1) {
      arr.splice(idx, 1);
      return true;
    }
    for (const f of arr.filter((x) => x.type === "folder")) {
      if (removeFromTree(item, f.children)) return true;
    }
    return false;
  };
  const deleteItem = (item) => {
    const cloned = structuredClone(files);
    const ok = removeFromTree(item, cloned);
    if (ok) {
      setFiles(cloned);
      setTrash([...trash, item]);
    }
  };
  const moveItem = (item, targetFolderId) => {
    const cloned = structuredClone(files);
    removeFromTree(item, cloned);
    if (targetFolderId) {
      const target = findFolder(targetFolderId, cloned);
      target.children.push(item);
    } else {
      cloned.push(item);
    }
    setFiles(cloned);
  };

  const currentFolder = useMemo(() => {
    if (!currentFolderId) return { children: files, up: null };
    const folder = findFolder(currentFolderId);
    return { ...folder, up: parentMap[currentFolderId] ?? null };
  }, [currentFolderId, files, parentMap]);

  /* ----- Navegación Atrás (Explorador) ----- */
  const goIntoFolder = (id) => {
    setExplorerBackStack((st) => [...st, currentFolderId]); // guarda el actual
    setCurrentFolderId(id);
  };
  const goBackExplorer = () => {
    setExplorerBackStack((st) => {
      if (st.length === 0) return st;
      const prev = st[st.length - 1] ?? null;
      setCurrentFolderId(prev);
      return st.slice(0, -1);
    });
  };

  /* ----- Login / Logout ----- */
  const handleLogin = (user) => {
    setSessionUser(user);
    setLoggedIn(true);
  };
  const logout = () => {
    setOpenWindows([]);
    setStartMenuOpen(false);
    setCurrentFolderId(null);
    setExplorerBackStack([]);
    setLoggedIn(false);
    setSessionUser(null);
  };

  /* =======================
     Barra de tareas: previews
     ======================= */
  const [hoveredWinId, setHoveredWinId] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const hoverTimeout = useRef(null);

  const handleHoverEnter = (id) => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setHoveredWinId(id);
    // pequeño delay para “sentir” hover
    hoverTimeout.current = setTimeout(() => setShowPreview(true), 120);
  };
  const handleHoverLeave = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    // fade-out
    hoverTimeout.current = setTimeout(() => {
      setShowPreview(false);
      setHoveredWinId(null);
    }, 150);
  };

  // Datos en vivo para miniaturas
  const previewState = {
    closeWindow,
    currentFolder,
    trash,
    processes,
  };

  /* =======================
     UI
     ======================= */
  return (
    <div className="h-screen w-screen bg-gradient-to-br from-blue-400 via-blue-600 to-gray-900 text-white relative overflow-hidden font-sans">
      {!loggedIn && <LoginScreen onLogin={handleLogin} />}
{/* Escritorio con íconos movibles */}
<div className="absolute inset-0 p-5 select-none">
  {DESKTOP_ICONS.map((icon, index) => (
    <Draggable key={icon.id} grid={[10, 10]}>
      <div
        className="absolute flex flex-col items-center cursor-pointer rounded-lg bg-white/25 backdrop-blur-sm shadow-lg px-5 py-4 transition-all hover:scale-110 hover:bg-white/40"
        onDoubleClick={() => loggedIn && openWindowByIcon(icon)}
        title={icon.name}
        style={{
          top: 100 + index * 100, // posición inicial vertical
          left: 60, // posición inicial horizontal
        }}
      >
        <div className="text-5xl mb-2 drop-shadow-md">{icon.emoji}</div>
        <span className="text-white font-semibold text-sm">{icon.name}</span>
      </div>
    </Draggable>
  ))}
</div>


      {/* Ventanas */}
      {loggedIn &&
        openWindows.map((win) => {
          if (win.name === "Mi PC") {
            return (
              <Window key={win.id} windowData={win} onClose={closeWindow} onMinimize={minimizeWindow} bringToFront={bringToFront}>
                <ThisPC />
              </Window>
            );
          }
          if (win.name === "Explorador") {
            const canGoBack = explorerBackStack.length > 0;
            return (
              <Window key={win.id} windowData={win} onClose={closeWindow} onMinimize={minimizeWindow} bringToFront={bringToFront}>
                <Explorer
                  currentFolder={currentFolder}
                  canGoBack={canGoBack}
                  goBack={goBackExplorer}
                  setCurrentFolderId={(id) => setCurrentFolderId(id)}
                  createFile={createFile}
                  createFolder={createFolder}
                  editFile={editFile}
                  deleteItem={deleteItem}
                  moveItem={moveItem}
                  findFolder={findFolder}
                  findFile={findFile}
                />
                {/* Sobrescribimos navegación al entrar a carpeta */}
                <style>{`
                  /* solo referencia visual */
                `}</style>
              </Window>
            );
          }
          if (win.name === "Papelera") {
            return (
              <Window key={win.id} windowData={win} onClose={closeWindow} onMinimize={minimizeWindow} bringToFront={bringToFront}>
                <RecycleBin
                  trash={trash}
                  hasBack={recycleCanGoBack}
                  goBack={() => closeWindow(win.id)} // “Atrás” = cerrar papelera y volver
                  restore={(item) => {
                    moveItem(item, null);
                    setTrash(trash.filter((t) => t.id !== item.id));
                  }}
                  remove={(item) => setTrash(trash.filter((t) => t.id !== item.id))}
                  empty={() => setTrash([])}
                />
              </Window>
            );
          }
          if (win.name === "Procesos") {
            return (
              <Window key={win.id} windowData={win} onClose={closeWindow} onMinimize={minimizeWindow} bringToFront={bringToFront}>
                <ProcessViewer processes={processes} kill={killProcess} />
              </Window>
            );
          }
          return null;
        })}

      {/* Barra de tareas */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gray-900/70 backdrop-blur-md flex justify-between items-center px-4 border-t border-white/20 shadow-inner">
        {/* Botón Inicio redondo */}
        <div className="relative">
          <button
            className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg flex items-center justify-center hover:brightness-110 transition"
            onClick={() => loggedIn && setStartMenuOpen((s) => !s)}
            title="Inicio"
          >
            <div className="grid grid-cols-2 gap-0.5">
              <span className="w-3 h-3 bg-white/90 rounded-sm" />
              <span className="w-3 h-3 bg-white/90 rounded-sm" />
              <span className="w-3 h-3 bg-white/90 rounded-sm" />
              <span className="w-3 h-3 bg-white/90 rounded-sm" />
            </div>
          </button>

          {/* Menú Inicio */}
          {loggedIn && startMenuOpen && (
            <div className="absolute bottom-16 left-0 w-56 bg-gray-800/90 backdrop-blur-md rounded-lg shadow-lg p-2 flex flex-col gap-2">
              <button
                className="hover:bg-gray-700/60 p-2 rounded text-left"
                onClick={() => openWindowByIcon(DESKTOP_ICONS.find((i) => i.name === "Explorador"))}
              >
                📁 Explorador
              </button>
              <button
                className="hover:bg-gray-700/60 p-2 rounded text-left"
                onClick={() => openWindowByIcon(DESKTOP_ICONS.find((i) => i.name === "Mi PC"))}
              >
                🖥️ Mi PC
              </button>
              <button
                className="hover:bg-gray-700/60 p-2 rounded text-left"
                onClick={() => openWindowByIcon(DESKTOP_ICONS.find((i) => i.name === "Papelera"))}
              >
                🗑️ Papelera
              </button>
              <button
                className="hover:bg-gray-700/60 p-2 rounded text-left"
                onClick={() => openWindowByIcon(DESKTOP_ICONS.find((i) => i.name === "Procesos"))}
              >
                📊 Visor de procesos
              </button>
              <div className="h-px bg-white/10 my-1" />
              <button className="hover:bg-gray-700/60 p-2 rounded text-left text-red-200" onClick={logout}>
                🔒 Cerrar sesión
              </button>
            </div>
          )}
        </div>

        {/* Botones de ventanas con miniaturas */}
        <div className="flex gap-2">
          {loggedIn &&
            openWindows.map((w) => {
              const isHovered = hoveredWinId === w.id && showPreview;
              return (
                <div
                  key={w.id}
                  className="relative"
                  onMouseEnter={() => handleHoverEnter(w.id)}
                  onMouseLeave={handleHoverLeave}
                >
                  <button
                    className={`px-3 py-1 rounded-lg hover:bg-gray-700/50 ${
                      w.minimized ? "bg-gray-600/50" : "bg-gray-800/60"
                    }`}
                    onClick={() =>
                      setOpenWindows(
                        openWindows.map((win) => (win.id === w.id ? { ...win, minimized: !win.minimized } : win))
                      )
                    }
                  >
                    {w.name}
                  </button>

                  {/* Miniatura viva (200x130) */}
                  {isHovered && (
                    <div
                      className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[5000] transition-opacity duration-200"
                      style={{ opacity: isHovered ? 1 : 0 }}
                      onMouseEnter={() => handleHoverEnter(w.id)}
                      onMouseLeave={handleHoverLeave}
                    >
                      <MiniPreview
                        win={w}
                        type={w.name}
                        state={{
                          ...previewState,
                          closeWindow,
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        {/* Reloj */}
        <div className="text-right text-white leading-tight">
          <span className="block text-lg font-semibold">
            {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          <span className="text-sm">{time.toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
 