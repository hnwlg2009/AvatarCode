## ADDED Requirements

### Requirement: Logo Design
The system SHALL have a logo icon featuring a "C" wrapping around an "A" letter.

#### Scenario: Logo visual design
- **WHEN** logo is displayed
- **THEN** it SHALL show a stylized "C" as the outer element
- **AND** a stylized "A" as the inner element
- **AND** use the application's primary color scheme (#6366F1 / #8B5CF6)

### Requirement: Multi-format Support
The system SHALL provide logo in multiple formats for different platforms.

#### Scenario: Windows icon
- **WHEN** building for Windows
- **THEN** an ICO file SHALL be available at `build/icon.ico`
- **AND** support sizes 16, 32, 48, 64, 128, 256 pixels

#### Scenario: macOS icon
- **WHEN** building for macOS
- **THEN** an ICNS file SHALL be available at `build/icon.icns`
- **AND** support sizes 16, 32, 64, 128, 256, 512, 1024 pixels

#### Scenario: Generic PNG
- **WHEN** generic icon is needed
- **THEN** PNG files SHALL be available at `build/icon-{size}.png`
- **AND** support sizes 16, 32, 64, 128, 256, 512 pixels

### Requirement: Application Integration
The system SHALL use the logo as the application icon.

#### Scenario: Electron window icon
- **WHEN** application window is displayed
- **THEN** the logo SHALL appear in the title bar
- **AND** the logo SHALL appear in the taskbar/dock

#### Scenario: Installer icon
- **WHEN** installer is created
- **THEN** the logo SHALL be used as the installer icon
- **AND** the logo SHALL be used as the uninstaller icon
