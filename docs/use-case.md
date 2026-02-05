flowchart LR
  %% Actors
  Visitor((Visitor))
  Official((Official/Doctor))
  Officer((Officer))
  Staff((Staff))
  Warden((Warden))
  Analyst((Analyst))
  Admin((Admin))
  PreApp[[Pre-Registration App]]
  Auth[[Authentication Service]]

  %% System boundary
  subgraph VisitTrack
    UC_Auth[Authenticate User]
    UC_Dash[View Dashboard]
    UC_Forecast[Forecast Visitors]
    UC_Interpret[Interpret Forecast (badge, suggestion, legend)]
    UC_RegVis[Register Visitor]
    UC_RegExt[Register Official/Doctor]
    UC_ScanCI[Scan and Check-In]
    UC_CheckOut[Check-Out Visitor]
    UC_Personnel[Manage Personnel]
    UC_Logs[View Visit Logs]
    UC_Reports[Generate Reports]
    UC_Heatmap[View Heatmap/Trends]
    UC_Export[Export Data (CSV/PNG)]
    UC_Users[Manage Users]
    UC_Rename[Rename User]
    UC_Audit[View Audit Trails]
    UC_Prefs[Theme/Interface Preferences]
    UC_PreReg[Pre-Register (Public)]
  end

  %% Relationships
  UC_Interpret -.extends.-> UC_Dash
  UC_Reports --> UC_Export
  UC_Users --> UC_Rename

  %% Actor to UC Links
  Visitor --> UC_PreReg
  Official --> UC_PreReg

  Officer --> UC_Auth
  Officer --> UC_ScanCI
  Officer --> UC_CheckOut
  Officer --> UC_RegVis

  Staff --> UC_Auth
  Staff --> UC_RegVis
  Staff --> UC_RegExt
  Staff --> UC_ScanCI
  Staff --> UC_CheckOut
  Staff --> UC_Personnel
  Staff --> UC_Logs
  Staff --> UC_Dash
  Staff --> UC_Reports
  Staff --> UC_Heatmap
  Staff --> UC_Prefs

  Warden --> UC_Auth
  Warden --> UC_Logs
  Warden --> UC_Dash
  Warden --> UC_Reports
  Warden --> UC_Heatmap

  Analyst --> UC_Auth
  Analyst --> UC_Dash
  Analyst --> UC_Forecast
  Analyst --> UC_Interpret
  Analyst --> UC_Reports
  Analyst --> UC_Heatmap
  Analyst --> UC_Export

  Admin --> UC_Auth
  Admin --> UC_Users
  Admin --> UC_Rename
  Admin --> UC_Audit
  Admin --> UC_Dash
  Admin --> UC_Reports

  %% System integrations
  PreApp --> UC_PreReg
  Auth --> UC_Auth