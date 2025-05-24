import MuseumViewer from '../src/component/MuseumViewer';
import Login from './TestSolana/Login';
function App() {
  return (
        <Login/>
      /* <MuseumViewer />
      <div className="loading-container" id="loading-container">

          <div id="loading-bar">
              <div id="progress"></div>
          </div>
  
          <div className="flex flex-col" style={{ gap: '15px', textAlign: 'center' }}>
              <div>Loading gallery. Please wait...</div>
              <div> Tip: use WASD keys to look around </div>
          </div>
  
      </div>
  
      <div className="menu-container" id="menu-container">
          <div className="flex" style={{ width: '100%' }}>
              <i className="bi bi-x" id="menu-close"></i>
          </div>
          <h2>
              Menu
          </h2>
  
          <div style={{ fontSize: '18px', fontWeight: 600 }}>
              Select the Gallery / Museum
          </div>
          <div id="menu-selection-list">
  
          </div>
          <hr style={{ marginTop: '30px' }} />
          <div>
              <ul style={{ fontSize: '14px', color: '#2a2a2a', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <li>Use WASD to move around</li>
                  <li>Use space to Jump</li>
                  <li>Escape key to open/close menu</li>
                  <li>Hover on annotation for details</li>
                  <li>Click on annotation to upload image</li>
              </ul>
          </div>
  
      </div>
  
      <div className="toast-alert" id="toast-alert" style={{ display: 'none' }}>
      </div>
  
      <div className="upload-modal" id="upload-modal" style={{ display: 'none' }}>
          <div id="upload-close" className="upload-modal-close">
              <i className="bi bi-x"></i>
          </div>
          <div className="upload-container" id="upload-container">
              
              <div id="upload-text">Upload image here</div>
              
              <img className="upload-preview" id="upload-preview" />
              <input type="file" id="upload-input" accept=".png, .jpg, .jpeg" style={{ display: 'none' }}/>
          </div>
          <div className="upload-details">
              <input type="text" name="" id="upload-title" placeholder="title" maxLength="30"/>
              <textarea name="" id="upload-description" placeholder="description"></textarea>
              <input type="text" name="" id="upload-handle" placeholder="twitter handle" maxLength="30"/>
              <button type="submit" id="upload-btn" className="btn" style={{ display: 'flex', gap: '5px', justifyContent: 'center', alignItems: 'center' }}>
                  Upload 
                  <div className="spinner" id="upload-spinner" style={{ display: 'none' }}></div>
              </button>
          </div>
      </div>
  
      <div className="upload-cropper-container" id="upload-cropper-container" 
              style={{ display: 'none' }}>
          <div id="cropper-container" className="upload-cropper">
              <img className="crop-preview" id="crop-preview"/>
          </div>
          <div className="btn" id="crop-btn">Crop</div>
      </div>
      <div id="model-container"></div> */
  )
}

export default App;
