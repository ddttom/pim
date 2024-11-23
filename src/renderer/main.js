// src/renderer/main.js

import DataEntry from './components/forms/dataEntry';
import DataOrganization from './components/organization/dataOrganization';
import ViewSystem from './components/views/viewSystem';
import FilterSystem from './components/filters/filterSystem';
import TabManagement from './components/tabs/tabManagement';
import PrintSystem from './components/print/printSystem';

/**
 * Main Renderer Process
 * Integrates data entry, data organization, view system, filter system, tab management, and print system components.
 */

document.addEventListener('DOMContentLoaded', () => {
  const appContainer = document.getElementById('app');

  // Initialize components
  const dataEntry = new DataEntry();
  const dataOrganization = new DataOrganization();
  const viewSystem = new ViewSystem();
  const filterSystem = new FilterSystem();
  const tabManagement = new TabManagement();
  const printSystem = new PrintSystem();

  // Render data entry form
  const dataEntryForm = dataEntry.render();
  appContainer.appendChild(dataEntryForm);

  // Example usage of data organization
  dataOrganization.addCategory('Work');
  dataOrganization.addTag('Important');
  dataOrganization.setMetadata('createdBy', 'User');

  // Add tabs and set layout for view system
  viewSystem.addTab('Dashboard');
  viewSystem.addTab('Tasks');
  viewSystem.setLayout('card');

  // Render view system
  const viewElement = viewSystem.render();
  appContainer.appendChild(viewElement);

  // Add filters and render filter system
  filterSystem.addFilter('due this week');
  filterSystem.addFilter('High priority');
  const filterElement = filterSystem.render();
  appContainer.appendChild(filterElement);

  // Add tabs and render tab management system
  tabManagement.addTab('Home');
  tabManagement.addTab('Projects');
  const tabElement = tabManagement.render();
  appContainer.appendChild(tabElement);

  // Set print format and render print system
  printSystem.setFormat('detailed');
  const printElement = printSystem.render();
  appContainer.appendChild(printElement);

  console.log('Application Initialized');
});
