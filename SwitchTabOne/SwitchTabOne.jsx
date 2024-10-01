import "./SwitchTabOne.css";
import { useState, useEffect } from "react";
import database from "./images/database.png";
import { Input } from '@mui/base/Input';
import { useParams } from "react-router-dom";
import Dropdown from '@mui/joy/Dropdown';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { Checkbox, FormControlLabel } from '@mui/material';
import axios from 'axios';
import datasource from "./images/data-source.png";
import profiling from "./images/profiling.png";
import monitoringchecks from "./images/monitoring-checks.png";
import partitionchecks from "./images/partition-checks.png";
import { REACT_BASE_LOCAL_URL, REACT_BASE_PROD_URL } from "../../../../config";

export default function SwitchTabOne() {

  const [cronExpression, setCronExpression] = useState("0 1 1 * *");
  const [disableSchedule, setDisableSchedule] = useState(false);
  const [scheduleOption, setScheduleOption] = useState("custom"); // default to custom expression
  const [runEveryMinutes, setRunEveryMinutes] = useState(15);
  const [minutesPastEveryHour, setMinutesPastEveryHour] = useState(0);
  const [dailyRunHour, setDailyRunHour] = useState(8);
  const [dailyRunMinute, setDailyRunMinute] = useState(0);
  const [importedSchemas, setImportedSchemas] = useState([]);
  const [openProfilingDialog, setOpenProfilingDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("connection");
  const [activeScheduleTab, setActiveScheduleTab] = useState("profiling");
  const [showImportSchemas, setShowImportSchemas] = useState(false);
  const [showTableList, setShowTableList] = useState(false);
  const [selectedSchema, setSelectedSchema] = useState(null);
  const [subTab, setSubTab] = useState("import tables");
  const { connectionName } = useParams();
  const [schemas, setSchemas] = useState([]);
  const [tables, setTables] = useState([]);
  const [selectedTables, setSelectedTables] = useState([]);

  const [tableData, setTableData] = useState([]);
  const [loadingTables, setLoadingTables] = useState(true);
  const [errorTables, setErrorTables] = useState(null);

  const [columnData, setColumnData] = useState([]);
  const [loadingColumns, setLoadingColumns] = useState(true);
  const [errorColumns, setErrorColumns] = useState(null);

  const handleCronChange = (e) => setCronExpression(e.target.value);
  const handleDisableChange = () => setDisableSchedule(!disableSchedule);
  const handleScheduleOptionChange = (e) => setScheduleOption(e.target.value);

  const [inputValue, setInputValue] = useState("");
  const [connectionDetails, setConnectionDetails] = useState({
    host: "172.16.200.43",
    port: "",
    database: "xenonstack",
    username: "postgres",
    password: "",
    sslMode: "disable",
    jdbcKey: "",
    jdbcValue: ""
  });

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const handleScheduleTabClick = (tab) => {
    setActiveScheduleTab(tab);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setConnectionDetails((prevDetails) => ({
      ...prevDetails,
      [name]: value
    }));
  };

  const handleImportClick = () => {
    setShowImportSchemas(true);
  };

  const handleImportSchemasClick = () => {
    setShowImportSchemas(true);
  };

  const handleBackClick = () => {
    setShowImportSchemas(false);
    setShowTableList(false);
    setSelectedSchema(null);
  };

  const handleSubTabClick = (tab) => {
    setSubTab(tab);
  };

  useEffect(() => {
    if (connectionName) {
      fetch(REACT_BASE_LOCAL_URL + `/api/datasource/connections/${connectionName}/schemas`)
        .then(response => response.json())
        .then(data => {
          setSchemas(data);
        })
        .catch(error => console.error("Error fetching schemas:", error));
    }
  }, [connectionName]);

  useEffect(() => {
    if (connectionName) {
      fetch(REACT_BASE_LOCAL_URL + `/api/datasource/connections/${connectionName}/schemas`)
        .then(response => response.json())
        .then(data => {
          const filteredImportedSchemas = data.filter(schema => schema.alreadyImported);
          setImportedSchemas(filteredImportedSchemas);
        })
        .catch(error => console.error("Error fetching imported schemas:", error));
    }
  }, [connectionName]);


  const handleImportTablesClick = (schemaName) => {
    setShowTableList(true);
    setSelectedSchema(schemaName);
    fetchTables(schemaName);
  };

  const fetchTables = async (schemaName) => {
    try {
      const response = await fetch(REACT_BASE_LOCAL_URL + `/api/datasource/connections/${connectionName}/schemas/${schemaName}/tables?tableNameContains=`);
      const data = await response.json();
      setTables(data);
      setSelectedTables([]);
    } catch (error) {
      console.error("Error fetching tables:", error);
    }
  };

  const handleSelectAll = () => {
    setSelectedTables(tables.map(table => table.tableName));
  };

  const handleUnselectAll = () => {
    setSelectedTables([]);
  };

  const handleCheckboxChange = (tableName) => {
    setSelectedTables(prevSelected =>
      prevSelected.includes(tableName)
        ? prevSelected.filter(name => name !== tableName)
        : [...prevSelected, tableName]
    );
  };

  const handleImportSelectedTables = async () => {
    if (selectedTables.length === 0) {
      alert("Please select at least one table to import.");
      return;
    }
    const payload = {
      connectionName,
      schemaName: selectedSchema,
      tableNames: selectedTables,
      tableNameContains: ""
    };
    try {
      await fetch(REACT_BASE_LOCAL_URL + "/api/jobs/importtables?wait=false", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      setOpenProfilingDialog(true);
    } catch (error) {
      console.error("Error importing tables:", error);
    }
  };

  const handleCancelDialog = () => setOpenProfilingDialog(false);
  const handleStartProfiling = async () => {
    if (selectedTables.length === 0) {
      alert("Please select at least one table to profile.");
      return;
    }
    const payload = {
      check_search_filters: {
        connection: connectionName,
        fullTableName: `${selectedSchema}.${selectedTables[0]}`,
        checkType: "profiling"
      }
    };
    try {
      const response = await fetch(REACT_BASE_LOCAL_URL + "/api/jobs/runchecks?wait=false", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log("Profiling started successfully!");
      } else {
        console.error("Error starting profiling:", response.statusText);
      }
    } catch (error) {
      console.error("Error starting profiling:", error);
    }

    setOpenProfilingDialog(false);
  };

  // useEffect(() => {
  //   // Fetch data from the API
  //   const fetchData = async () => {
  //     try {
  //       const response = await axios.get(
  //         REACT_BASE_LOCAL_URL + `/api/search/tables?connection=${connectionName}&schema=&table=&page=1&limit=50&checkType=monitoring`
  //       );
  //       setData(response.data);
  //       setLoading(false);
  //     } catch (err) {
  //       setError(err);
  //       setLoading(false);
  //     }
  //   };

  //   fetchData();
  // }, [connectionName]);

  // if (loading) {
  //   return <div>Loading...</div>;
  // }

  // if (error) {
  //   return <div>Error: {error.message}</div>;
  // }

  useEffect(() => {
    // Fetch tables data
    const fetchTablesData = async () => {
      try {
        const response = await axios.get(
          REACT_BASE_LOCAL_URL + `/api/search/tables?connection=${connectionName}&schema=&table=&page=1&limit=50&checkType=monitoring`
        );
        setTableData(response.data);
        setLoadingTables(false);
      } catch (err) {
        setErrorTables(err);
        setLoadingTables(false);
      }
    };

    fetchTablesData();
  }, [connectionName]);

  useEffect(() => {
    // Fetch columns data
    const fetchColumnsData = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8888/api/search/columns?connection=${connectionName}&schema=&table=&column=&page=1&limit=50&checkType=monitoring`
        );
        setColumnData(response.data);
        setLoadingColumns(false);
      } catch (err) {
        setErrorColumns(err);
        setLoadingColumns(false);
      }
    };

    fetchColumnsData();
  }, [connectionName]);


  return (
    <div className="tab-content-one-wrapper">
      <div className="top-data-overview">
        <div className="left-data-overview">
          <div className="connection-name">
            <img src={database} alt="database" />
            <h2>{connectionName}</h2>
          </div>
        </div>
        <div className="right-data-overview">
          <div className="overview-button">
            <p>Add schema</p>
          </div>
          <div className="overview-button">
            <p>Delete connection</p>
          </div>
          <div className="overview-button">
            <p>Import metadata</p>
          </div>
          <div className="save">
            <p>Save</p>
          </div>
        </div>
      </div>

      <div className="tab-data-overview">
        <div
          className={`tab-data ${activeTab === "connection" ? "active" : ""}`}
          onClick={() => handleTabClick("connection")}
        >
          <p>Connection</p>
        </div>
        <div
          className={`tab-data ${activeTab === "schedule" ? "active" : ""}`}
          onClick={() => handleTabClick("schedule")}
        >
          <p>Schedule</p>
        </div>
        <div
          className={`tab-data ${activeTab === "schemas" ? "active" : ""}`}
          onClick={() => handleTabClick("schemas")}
        >
          <p>Schemas</p>
        </div>
        <div
          className={`tab-data ${activeTab === "data-quality" ? "active" : ""}`}
          onClick={() => handleTabClick("data-quality")}
        >
          <p>Data quality summary</p>
        </div>
      </div>

      {activeTab === "connection" && (
        <div className="tab-content connection-content">
          <div className="connection-top">
            <div className="connection-top-details">
              <p>Connection name</p> <p>test</p>
            </div>
            <div className="connection-bottom-details">
              <p>Parallel jobs limit</p>
              <input
                type="text"
                className="custom-input"
                value={inputValue}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div className="connection-form">
            {/* Form fields for Connection tab */}
            <div className="form-row">
              <label>Host</label>
              <input
                className="custom-input"
                type="text"
                name="host"
                value={connectionDetails.host}
                onChange={handleInputChange}
                placeholder="Enter Host"
              />
            </div>
            <div className="form-row">
              <label>Port</label>
              <input
                className="custom-input"
                type="text"
                name="port"
                value={connectionDetails.port}
                onChange={handleInputChange}
                placeholder="Enter Port"
              />
            </div>
            <div className="form-row">
              <label>Database</label>
              <input
                className="custom-input"
                type="text"
                name="database"
                value={connectionDetails.database}
                onChange={handleInputChange}
                placeholder="Enter Database"
              />
            </div>
            <div className="form-row">
              <label>User name</label>
              <input
                className="custom-input"
                type="text"
                name="username"
                value={connectionDetails.username}
                onChange={handleInputChange}
                placeholder="Enter User Name"
              />
            </div>
            <div className="form-row">
              <label>Password</label>
              <input
                className="custom-input"
                type="password"
                name="password"
                value={connectionDetails.password}
                onChange={handleInputChange}
                placeholder="Enter Password"
              />
            </div>
            <div className="form-row">
              <label>SSL Mode</label>
              <select
                className="custom-input"
                name="sslMode"
                value={connectionDetails.sslMode}
                onChange={handleInputChange}
              >
                <option value="disable">Disable</option>
                <option value="require">Require</option>
                <option value="verify-ca">Verify CA</option>
                <option value="verify-full">Verify Full</option>
              </select>
            </div>
            <div className="form-row">
              <label>JDBC connection property</label>
              <div className="jdbc-row">
                <input
                  type="text"
                  name="jdbcKey"
                  value={connectionDetails.jdbcKey}
                  onChange={handleInputChange}
                  placeholder="Key"
                />
                <input
                  type="text"
                  name="jdbcValue"
                  value={connectionDetails.jdbcValue}
                  onChange={handleInputChange}
                  placeholder="Value"
                />
              </div>
            </div>
            <div className="action-buttons">
              <button className="test-connection">Test Connection</button>
              <button className="save">Save</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "schedule" && (
        <div className="schedule-content">
          {/* inner tabs for the "Schedule" section */}
          <div className="nested-tab-overview">
            <div
              className={`tab-data ${activeScheduleTab === "profiling" ? "active" : ""}`}
              onClick={() => handleScheduleTabClick("profiling")}
            >
              <p>Profiling</p>
            </div>
            <div
              className={`tab-data ${activeScheduleTab === "monitoring" ? "active" : ""}`}
              onClick={() => handleScheduleTabClick("monitoring")}
            >
              <p>Monitoring</p>
            </div>
            <div
              className={`tab-data ${activeScheduleTab === "partition" ? "active" : ""}`}
              onClick={() => handleScheduleTabClick("partition")}
            >
              <p>Partition</p>
            </div>
          </div>

          {/* content for the nested tabs inside "schedule" */}
          {activeScheduleTab === "profiling" && (
            <div className="tab-content">
              <div className="form-row">
                <label>Unix cron expression</label>
                <input
                  type="text"
                  className="custom-input"
                  value={cronExpression}
                  onChange={handleCronChange}
                />
                <a href="https://crontab.guru/" target="_blank" rel="noopener noreferrer">
                  Unix cron expression documentation
                </a>
              </div>

              <div className="form-row">
                <label>
                  <input
                    type="checkbox"
                    checked={disableSchedule}
                    onChange={handleDisableChange}
                  />
                  Disable schedule
                </label>
              </div>

              <div className="form-row">
                <label>
                  <input
                    type="radio"
                    value="not-configured"
                    checked={scheduleOption === "not-configured"}
                    onChange={handleScheduleOptionChange}
                  />
                  Scheduled check execution not configured for all tables from this connection
                </label>
              </div>

              <div className="form-row">
                <label>
                  <input
                    type="radio"
                    value="run-every-minutes"
                    checked={scheduleOption === "run-every-minutes"}
                    onChange={handleScheduleOptionChange}
                  />
                  Run every
                  <input
                    type="number"
                    className="custom-input"
                    value={runEveryMinutes}
                    onChange={(e) => setRunEveryMinutes(e.target.value)}
                    style={{ width: "60px", marginLeft: "10px" }}
                  />
                  minutes
                </label>
              </div>

              <div className="form-row">
                <label>
                  <input
                    type="radio"
                    value="minutes-past-hour"
                    checked={scheduleOption === "minutes-past-hour"}
                    onChange={handleScheduleOptionChange}
                  />
                  Run
                  <input
                    type="number"
                    className="custom-input"
                    value={minutesPastEveryHour}
                    onChange={(e) => setMinutesPastEveryHour(e.target.value)}
                    style={{ width: "50px", marginLeft: "10px" }}
                  />
                  minutes past every hour
                </label>
              </div>

              <div className="form-row">
                <label>
                  <input
                    type="radio"
                    value="daily-run"
                    checked={scheduleOption === "daily-run"}
                    onChange={handleScheduleOptionChange}
                  />
                  Run every day at
                  <input
                    type="number"
                    className="custom-input"
                    value={dailyRunHour}
                    onChange={(e) => setDailyRunHour(e.target.value)}
                    style={{ width: "50px", marginLeft: "10px" }}
                  />
                  :
                  <input
                    type="number"
                    className="custom-input"
                    value={dailyRunMinute}
                    onChange={(e) => setDailyRunMinute(e.target.value)}
                    style={{ width: "50px", marginLeft: "10px" }}
                  />
                </label>
              </div>

              <div className="form-row">
                <label>
                  <input
                    type="radio"
                    value="custom"
                    checked={scheduleOption === "custom"}
                    onChange={handleScheduleOptionChange}
                  />
                  Use custom cron expression
                </label>
              </div>
            </div>
          )}
          {activeScheduleTab === "monitoring" && (
            <div className="tab-content">
              <div className="form-row">
                <label>Unix cron expression</label>
                <input
                  type="text"
                  className="custom-input"
                  value={cronExpression}
                  onChange={handleCronChange}
                />
                <a href="https://crontab.guru/" target="_blank" rel="noopener noreferrer">
                  Unix cron expression documentation
                </a>
              </div>

              <div className="form-row">
                <label>
                  <input
                    type="checkbox"
                    checked={disableSchedule}
                    onChange={handleDisableChange}
                  />
                  Disable schedule
                </label>
              </div>

              <div className="form-row">
                <label>
                  <input
                    type="radio"
                    value="not-configured"
                    checked={scheduleOption === "not-configured"}
                    onChange={handleScheduleOptionChange}
                  />
                  Scheduled check execution not configured for all tables from this connection
                </label>
              </div>

              <div className="form-row">
                <label>
                  <input
                    type="radio"
                    value="run-every-minutes"
                    checked={scheduleOption === "run-every-minutes"}
                    onChange={handleScheduleOptionChange}
                  />
                  Run every
                  <input
                    type="number"
                    className="custom-input"
                    value={runEveryMinutes}
                    onChange={(e) => setRunEveryMinutes(e.target.value)}
                    style={{ width: "60px", marginLeft: "10px" }}
                  />
                  minutes
                </label>
              </div>

              <div className="form-row">
                <label>
                  <input
                    type="radio"
                    value="minutes-past-hour"
                    checked={scheduleOption === "minutes-past-hour"}
                    onChange={handleScheduleOptionChange}
                  />
                  Run
                  <input
                    type="number"
                    className="custom-input"
                    value={minutesPastEveryHour}
                    onChange={(e) => setMinutesPastEveryHour(e.target.value)}
                    style={{ width: "50px", marginLeft: "10px" }}
                  />
                  minutes past every hour
                </label>
              </div>

              <div className="form-row">
                <label>
                  <input
                    type="radio"
                    value="daily-run"
                    checked={scheduleOption === "daily-run"}
                    onChange={handleScheduleOptionChange}
                  />
                  Run every day at
                  <input
                    type="number"
                    className="custom-input"
                    value={dailyRunHour}
                    onChange={(e) => setDailyRunHour(e.target.value)}
                    style={{ width: "50px", marginLeft: "10px" }}
                  />
                  :
                  <input
                    type="number"
                    className="custom-input"
                    value={dailyRunMinute}
                    onChange={(e) => setDailyRunMinute(e.target.value)}
                    style={{ width: "50px", marginLeft: "10px" }}
                  />
                </label>
              </div>

              <div className="form-row">
                <label>
                  <input
                    type="radio"
                    value="custom"
                    checked={scheduleOption === "custom"}
                    onChange={handleScheduleOptionChange}
                  />
                  Use custom cron expression
                </label>
              </div>
            </div>
          )}
          {activeScheduleTab === "partition" && (
            <div className="tab-content">
              <div className="form-row">
                <label>Unix cron expression</label>
                <input
                  type="text"
                  className="custom-input"
                  value={cronExpression}
                  onChange={handleCronChange}
                />
                <a href="https://crontab.guru/" target="_blank" rel="noopener noreferrer">
                  Unix cron expression documentation
                </a>
              </div>

              <div className="form-row">
                <label>
                  <input
                    type="checkbox"
                    checked={disableSchedule}
                    onChange={handleDisableChange}
                  />
                  Disable schedule
                </label>
              </div>

              <div className="form-row">
                <label>
                  <input
                    type="radio"
                    value="not-configured"
                    checked={scheduleOption === "not-configured"}
                    onChange={handleScheduleOptionChange}
                  />
                  Scheduled check execution not configured for all tables from this connection
                </label>
              </div>

              <div className="form-row">
                <label>
                  <input
                    type="radio"
                    value="run-every-minutes"
                    checked={scheduleOption === "run-every-minutes"}
                    onChange={handleScheduleOptionChange}
                  />
                  Run every
                  <input
                    type="number"
                    className="custom-input"
                    value={runEveryMinutes}
                    onChange={(e) => setRunEveryMinutes(e.target.value)}
                    style={{ width: "60px", marginLeft: "10px" }}
                  />
                  minutes
                </label>
              </div>

              <div className="form-row">
                <label>
                  <input
                    type="radio"
                    value="minutes-past-hour"
                    checked={scheduleOption === "minutes-past-hour"}
                    onChange={handleScheduleOptionChange}
                  />
                  Run
                  <input
                    type="number"
                    className="custom-input"
                    value={minutesPastEveryHour}
                    onChange={(e) => setMinutesPastEveryHour(e.target.value)}
                    style={{ width: "50px", marginLeft: "10px" }}
                  />
                  minutes past every hour
                </label>
              </div>

              <div className="form-row">
                <label>
                  <input
                    type="radio"
                    value="daily-run"
                    checked={scheduleOption === "daily-run"}
                    onChange={handleScheduleOptionChange}
                  />
                  Run every day at
                  <input
                    type="number"
                    className="custom-input"
                    value={dailyRunHour}
                    onChange={(e) => setDailyRunHour(e.target.value)}
                    style={{ width: "50px", marginLeft: "10px" }}
                  />
                  :
                  <input
                    type="number"
                    className="custom-input"
                    value={dailyRunMinute}
                    onChange={(e) => setDailyRunMinute(e.target.value)}
                    style={{ width: "50px", marginLeft: "10px" }}
                  />
                </label>
              </div>

              <div className="form-row">
                <label>
                  <input
                    type="radio"
                    value="custom"
                    checked={scheduleOption === "custom"}
                    onChange={handleScheduleOptionChange}
                  />
                  Use custom cron expression
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "schemas" && (
        <div className="schema-container">
          {showImportSchemas ? (
            showTableList ? (
              <div className="table-list-view">
                <div className="tab-data-overview">
                  <div
                    className={`tab-data ${subTab === "import tables" ? "active" : ""}`}
                    onClick={() => handleSubTabClick("import tables")}
                  >
                    <p>Import tables</p>
                  </div>
                  <div
                    className={`tab-data ${subTab === "data quality summary" ? "active" : ""}`}
                    onClick={() => handleSubTabClick("data quality summary")}
                  >
                    <p>Data quality summary</p>
                  </div>
                </div>

                {subTab === "import tables" ? (
                  <div className="import-wrapper">
                    <div className="import-top-wrapper">
                      <div className="table-actions">
                        <button onClick={handleBackClick}>Back</button>
                        <button onClick={handleSelectAll}>Select all</button>
                        <button onClick={handleUnselectAll}>Unselect all</button>
                        <button onClick={handleImportSelectedTables}>Import selected tables</button>
                        <button onClick={() => console.log("Import all tables clicked")}>Import all tables</button>
                      </div>
                      <h2>Tables for schema: {selectedSchema}</h2>
                    </div>
                    <div className="tab-content">
                      <div className="search-and-actions">
                        <input type="text" placeholder="Table name contains" />
                        <button>Search</button>
                      </div>
                      <table className="schema-table">
                        <thead>
                          <tr>
                            <th>Select</th>
                            <th>Table name</th>
                            <th>Import status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tables.map((table) => (
                            <tr key={table.tableName}>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={selectedTables.includes(table.tableName)}
                                  onChange={() => handleCheckboxChange(table.tableName)}
                                />
                              </td>
                              <td>{table.tableName}</td>
                              <td>{table.alreadyImported ? '✅' : '❌'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="data-quality-summary">
                    <h2>Data Quality Summary for schema: {selectedSchema}</h2>
                    <p>Data quality information and statistics will be displayed here.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="import-schema-view">
                <div className="import-top-wrapper">
                  <button onClick={handleBackClick}>Back</button>
                  <h2>List of schemas present in the data source</h2>
                </div>
                <table className="schema-table">
                  <thead>
                    <tr>
                      <th>Source schema name</th>
                      <th>Import status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schemas.map((schema) => (
                      <tr key={schema.schemaName}>
                        <td>{schema.schemaName}</td>
                        <td>{schema.alreadyImported ? '✅' : '❌'}</td>
                        <td>
                          <button onClick={() => handleImportTablesClick(schema.schemaName)}>Import tables</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div className="schema-wrapper">
              <h2>Imported Schemas</h2>
              <div className="all-schema-database">
                {importedSchemas.length > 0 ? (
                  importedSchemas.map(schema => (
                    <p key={schema.schemaName}>{schema.schemaName}</p>
                  ))
                ) : (
                  <p>No schemas have been imported yet.</p>
                )}
                <div className="import-tables">
                  <p>Import tables</p>
                </div>
              </div>
              <div className="add-schema">
                <button onClick={handleImportClick}>Import more schemas</button>
              </div>
            </div>
          )}
        </div>
      )}
      {activeTab === "data-quality" && (
        <div>
          <div className="nested-tab-overview">
            <div
              className={`tab-data ${activeScheduleTab === "data-tables" ? "active" : ""}`}
              onClick={() => handleScheduleTabClick("data-tables")}
            >
              <p>Tables</p>
            </div>
            <div
              className={`tab-data ${activeScheduleTab === "data-columns" ? "active" : ""}`}
              onClick={() => handleScheduleTabClick("data-columns")}
            >
              <p>Columns</p>
            </div>
          </div>
          {activeScheduleTab === "data-tables" && (
            <div className="data-tables-container">
              <div className="filter-section">
                <input type="text" placeholder="Schema name" className="filter-input" />
                <input type="text" placeholder="Table name" className="filter-input" />
                <button className="search-button">Search</button>
                <button className="reset-button">Reset</button>
              </div>

              <table className="data-table">
                <thead>
                  <tr>
                    <th>Schema</th>
                    <th>Table</th>
                    <th>Data quality KPI</th>
                    <th>Completeness</th>
                    <th>Validity</th>
                    <th>Consistency</th>
                    <th>Availability</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center' }}>
                        No data available
                      </td>
                    </tr>
                  ) : (
                    tableData.map((item) => {
                      const {
                        schema_name,
                        table_name,
                        data_quality_kpi,
                        dimensions,
                      } = item.data_quality_status;

                      return (
                        <tr key={item.table_hash}>
                          <td>{item.target.schema_name}</td>
                          <td>{item.target.table_name}</td>
                          <td>
                            {data_quality_kpi ? (
                              <span
                                style={{
                                  backgroundColor:
                                    data_quality_kpi < 100 ? 'rgb(239, 236, 130)' : '#fb7857',
                                  padding: '3px 5px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: '300',
                                }}
                              >
                                {`${data_quality_kpi}%`}
                              </span>
                            ) : (
                              <span
                                style={{
                                  visibility: 'hidden',
                                  display: 'inline-block',
                                  width: '100%',
                                }}
                              >
                                N/A
                              </span>
                            )}
                          </td>
                          <td>
                            {dimensions?.Completeness?.data_quality_kpi ? (
                              <span
                                style={{
                                  backgroundColor:
                                    dimensions.Completeness.current_severity === 'warning'
                                      ? 'rgb(239, 236, 130)'
                                      : '#fb7857',
                                  padding: '3px 5px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: '300',
                                }}
                              >
                                {`${dimensions.Completeness.data_quality_kpi}%`}
                              </span>
                            ) : (
                              <span
                                style={{
                                  visibility: 'hidden',
                                  display: 'inline-block',
                                  width: '100%',
                                }}
                              >
                                N/A
                              </span>
                            )}
                          </td>
                          <td>
                            {dimensions?.Validity?.data_quality_kpi ? (
                              <span
                                style={{
                                  backgroundColor:
                                    dimensions.Validity.current_severity === 'warning'
                                      ? 'rgb(239, 236, 130)'
                                      : '#fb7857',
                                  padding: '3px 5px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: '300',
                                }}
                              >
                                {`${dimensions.Validity.data_quality_kpi}%`}
                              </span>
                            ) : (
                              <span
                                style={{
                                  visibility: 'hidden',
                                  display: 'inline-block',
                                  width: '100%',
                                }}
                              >
                                N/A
                              </span>
                            )}
                          </td>
                          <td>
                            {dimensions?.Consistency?.data_quality_kpi ? (
                              <span
                                style={{
                                  backgroundColor:
                                    dimensions.Consistency.current_severity === 'warning'
                                      ? 'rgb(239, 236, 130)'
                                      : '#fb7857',
                                  padding: '3px 5px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: '300',
                                }}
                              >
                                {`${dimensions.Consistency.data_quality_kpi}%`}
                              </span>
                            ) : (
                              <span
                                style={{
                                  visibility: 'hidden',
                                  display: 'inline-block',
                                  width: '100%',
                                }}
                              >
                                N/A
                              </span>
                            )}
                          </td>
                          <td>
                            {dimensions?.Availability?.data_quality_kpi ? (
                              <span
                                style={{
                                  backgroundColor:
                                    dimensions.Availability.current_severity === 'warning'
                                      ? 'rgb(239, 236, 130)'
                                      : '#fb7857',
                                  padding: '3px 5px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: '300',
                                }}
                              >
                                {`${dimensions.Availability.data_quality_kpi}%`}
                              </span>
                            ) : (
                              <span
                                style={{
                                  visibility: 'hidden',
                                  display: 'inline-block',
                                  width: '100%',
                                }}
                              >
                                N/A
                              </span>
                            )}
                          </td>
                          <td style={{ display: 'flex', justifyContent: 'center' }}>
                            <img
                              src={datasource}
                              style={{
                                width: '18px',
                                height: '20px',
                                cursor: 'pointer',
                                marginRight: '5px',
                              }}
                              alt="Data Source"
                            />
                            <img
                              src={profiling}
                              style={{
                                width: '18px',
                                height: '20px',
                                cursor: 'pointer',
                                marginRight: '5px',
                              }}
                              alt="Profiling"
                            />
                            <img
                              src={monitoringchecks}
                              style={{
                                width: '18px',
                                height: '20px',
                                cursor: 'pointer',
                                marginRight: '5px',
                              }}
                              alt="Monitoring Checks"
                            />
                            <img
                              src={partitionchecks}
                              style={{
                                width: '18px',
                                height: '20px',
                                cursor: 'pointer',
                              }}
                              alt="Partition Checks"
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              <div className="pagination">
                <p>Rows per page</p>
                <select>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>
          )}
          {activeScheduleTab === 'data-columns' && (
            <div className="data-columns-container">
              <div className="filter-section">
                <input type="text" placeholder="Schema name" className="filter-input" />
                <input type="text" placeholder="Table name" className="filter-input" />
                <input type="text" placeholder="Column name" className="filter-input" />
                <input type="text" placeholder="Column type" className="filter-input" />
                <button className="search-button">Search</button>
                <button className="reset-button">Reset</button>
              </div>
              <table className="data-columns">
                <thead>
                  <tr>
                    <th>Schema</th>
                    <th>Table</th>
                    <th>Column</th>
                    <th>Column Type</th>
                    <th>Data Quality KPI</th>
                    <th>Completeness</th>
                    <th>Validity</th>
                    <th>Consistency</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {columnData.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center' }}>No data available</td>
                    </tr>
                  ) : (
                    columnData.map((item) => {
                      const { schema_name, table_name, column_name, type_snapshot, data_quality_status } = item;
                      const dimensions = data_quality_status.dimensions || {};

                      return (
                        <tr key={item.column_hash}>
                          <td>{item.table.schema_name}</td>
                          <td>{item.table.table_name}</td>
                          <td>{item.column_name}</td>
                          <td>{type_snapshot.column_type}</td>
                          <td>
                            {data_quality_status?.data_quality_kpi ? (
                              <span
                                style={{
                                  backgroundColor: data_quality_status.data_quality_kpi < 100 ? 'rgb(239, 236, 130)' : '#fb7857',
                                  padding: '3px 5px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: '300',
                                }}
                              >
                                {`${data_quality_status.data_quality_kpi}%`}
                              </span>
                            ) : (
                              <span style={{ visibility: 'hidden', display: 'inline-block', width: '100%' }}>N/A</span>
                            )}
                          </td>
                          <td>
                            {dimensions?.Completeness?.data_quality_kpi ? (
                              <span
                                style={{
                                  backgroundColor: dimensions.Completeness.current_severity === 'warning'
                                    ? 'rgb(239, 236, 130)'
                                    : '#fb7857',
                                  padding: '3px 5px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: '300',
                                }}
                              >
                                {`${dimensions.Completeness.data_quality_kpi}%`}
                              </span>
                            ) : (
                              <span style={{ visibility: 'hidden', display: 'inline-block', width: '100%' }}>N/A</span>
                            )}
                          </td>
                          <td>
                            {dimensions?.Validity?.data_quality_kpi ? (
                              <span
                                style={{
                                  backgroundColor: dimensions.Validity.current_severity === 'warning'
                                    ? 'rgb(239, 236, 130)'
                                    : '#fb7857',
                                  padding: '3px 5px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: '300',
                                }}
                              >
                                {`${dimensions.Validity.data_quality_kpi}%`}
                              </span>
                            ) : (
                              <span style={{ visibility: 'hidden', display: 'inline-block', width: '100%' }}>N/A</span>
                            )}
                          </td>
                          <td>
                            {dimensions?.Consistency?.data_quality_kpi ? (
                              <span
                                style={{
                                  backgroundColor: dimensions.Consistency.current_severity === 'warning'
                                    ? 'rgb(239, 236, 130)'
                                    : '#fb7857',
                                  padding: '3px 5px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: '300',
                                }}
                              >
                                {`${dimensions.Consistency.data_quality_kpi}%`}
                              </span>
                            ) : (
                              <span style={{ visibility: 'hidden', display: 'inline-block', width: '100%' }}>N/A</span>
                            )}
                          </td>
                          <td style={{ display: 'flex', justifyContent: 'center' }}>
                            <img
                              src={datasource}
                              style={{ width: '18px', height: '20px', cursor: 'pointer', marginRight: '5px' }}
                              alt="Data Source"
                            />
                            <img
                              src={profiling}
                              style={{ width: '18px', height: '20px', cursor: 'pointer', marginRight: '5px' }}
                              alt="Profiling"
                            />
                            <img
                              src={monitoringchecks}
                              style={{ width: '18px', height: '20px', cursor: 'pointer', marginRight: '5px' }}
                              alt="Monitoring Checks"
                            />
                            <img
                              src={partitionchecks}
                              style={{ width: '18px', height: '20px', cursor: 'pointer' }}
                              alt="Partition Checks"
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              <div className="pagination">
                <p>Rows per page</p>
                <select>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}
      <Dialog
        open={openProfilingDialog}
        onClose={handleCancelDialog}
        sx={{
          '& .MuiDialog-paper': {
            padding: '20px',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '100%',
          },
        }}
      >
        <DialogTitle sx={{ backgroundColor: '#f5f5f5', fontSize: '1.5rem', fontWeight: 'bold', color: '#333' }}>
          New tables have been imported.
        </DialogTitle>

        <DialogContent sx={{ padding: '16px' }}>
          <DialogContentText sx={{ fontSize: '1rem', color: '#666', marginBottom: '10px', paddingTop: '10px' }}>
            It is recommended to collect statistics to enable data quality rule mining based on data samples.
          </DialogContentText>
          <FormControlLabel
            control={<Checkbox defaultChecked />}
            label="Collect basic statistics"
            sx={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', color: '#666' }}
          />
          <FormControlLabel
            control={<Checkbox defaultChecked />}
            label="Profile data with default profiling checks"
            sx={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', color: '#666' }}
          />
          <DialogContentText sx={{ fontSize: '0.875rem', color: '#d32f2f', fontWeight: 'bold', marginTop: '12px' }}>
            Warning: If you have imported many tables, avoid profiling all tables simultaneously.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ display: 'flex', justifyContent: 'flex-end', padding: '16px' }}>
          <Button
            onClick={handleCancelDialog}
            sx={{
              backgroundColor: '#f5f5f5',
              color: '#333',
              fontWeight: 'bold',
              marginRight: '8px',
              padding: '8px 16px',
              borderRadius: '4px',
              '&:hover': { backgroundColor: '#e0e0e0' },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleStartProfiling}
            sx={{
              backgroundColor: '#d32f2f',
              color: 'white',
              fontWeight: 'bold',
              padding: '8px 16px',
              borderRadius: '4px',
              '&:hover': { backgroundColor: '#c62828' },
            }}
          >
            Start profiling
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
