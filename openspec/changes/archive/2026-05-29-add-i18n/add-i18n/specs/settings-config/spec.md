## MODIFIED Requirements

### Requirement: Settings Store
The system SHALL maintain a Zustand store for application settings with language preference support.

#### Scenario: Language preference storage
- **WHEN** user changes language setting
- **THEN** store SHALL update the language preference
- **AND** persist the change to localStorage

#### Scenario: Settings initialization
- **WHEN** application starts
- **THEN** settings store SHALL load language preference from localStorage
- **AND** apply it to the i18n framework

### Requirement: Settings UI
The system SHALL provide a settings panel with language selection option.

#### Scenario: Language selector display
- **WHEN** user opens settings panel
- **THEN** a language dropdown SHALL be displayed
- **AND** show available languages (English, 中文)

#### Scenario: Language selection
- **WHEN** user selects a language from dropdown
- **THEN** UI SHALL immediately update to the selected language
- **AND** setting SHALL be saved automatically

### Requirement: Settings Persistence
The system SHALL persist user settings across application restarts.

#### Scenario: Language persistence
- **WHEN** user closes and reopens the application
- **THEN** previously selected language SHALL be restored
- **AND** UI SHALL display in the saved language
