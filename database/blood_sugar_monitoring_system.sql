-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 17, 2025 at 04:33 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `blood_sugar_monitoring_system`
--

CREATE DATABASE IF NOT EXISTS `blood_sugar_monitoring_system`;
USE `blood_sugar_monitoring_system`;

-- --------------------------------------------------------

--
-- Table structure for table `administrator`
--

CREATE TABLE `administrator` (
  `Admin_ID` int(11) NOT NULL,
  `Admin_Level` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `administrator`
--

INSERT INTO `administrator` (`Admin_ID`, `Admin_Level`) VALUES
(11, 'SuperAdmin');

-- --------------------------------------------------------

--
-- Table structure for table `aipatternanalyzer`
--

CREATE TABLE `aipatternanalyzer` (
  `Analysis_ID` int(11) NOT NULL,
  `Patient_ID` int(11) NOT NULL,
  `Analysis_DateTime` datetime DEFAULT current_timestamp(),
  `Pattern_Data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`Pattern_Data`)),
  `Correlation_Results` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`Correlation_Results`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ai_suggestion`
--

CREATE TABLE `ai_suggestion` (
  `Suggestion_ID` int(11) NOT NULL,
  `Patient_ID` int(11) NOT NULL,
  `Content` text DEFAULT NULL,
  `Generated_At` datetime DEFAULT current_timestamp(),
  `Based_On_Pattern` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `alert`
--

CREATE TABLE `alert` (
  `Alert_ID` int(11) NOT NULL,
  `Patient_ID` int(11) NOT NULL,
  `Week_Start` date NOT NULL,
  `Abnormal_Count` int(11) DEFAULT 0,
  `Sent_At` datetime DEFAULT current_timestamp(),
  `Recipients` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `categorythreshold`
--

CREATE TABLE `categorythreshold` (
  `Threshold_ID` int(11) NOT NULL,
  `Normal_Low` float NOT NULL,
  `Normal_High` float NOT NULL,
  `Borderline_Low` float NOT NULL,
  `Borderline_High` float NOT NULL,
  `Abnormal_Low` float NOT NULL,
  `Abnormal_High` float NOT NULL,
  `Effective_Date` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categorythreshold`
--

INSERT INTO `categorythreshold` (`Threshold_ID`, `Normal_Low`, `Normal_High`, `Borderline_Low`, `Borderline_High`, `Abnormal_Low`, `Abnormal_High`, `Effective_Date`) VALUES
(1, 70.0, 100.0, 100.1, 140.0, 140.1, 300.0, NOW());

-- --------------------------------------------------------

--
-- Table structure for table `clinic_staff`
--

CREATE TABLE `clinic_staff` (
  `Staff_ID` int(11) NOT NULL,
  `Working_ID` varchar(50) NOT NULL,
  `Department` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `clinic_staff`
--

INSERT INTO `clinic_staff` (`Staff_ID`, `Working_ID`, `Department`) VALUES
(9, 'STF001', 'Reception'),
(10, 'STF002', 'Lab');

-- --------------------------------------------------------

--
-- Table structure for table `feedback`
--

CREATE TABLE `feedback` (
  `Feedback_ID` int(11) NOT NULL,
  `Specialist_ID` int(11) NOT NULL,
  `Patient_ID` int(11) NOT NULL,
  `Content` text DEFAULT NULL,
  `Created_At` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `patient`
--

CREATE TABLE `patient` (
  `Patient_ID` int(11) NOT NULL,
  `Healthcare_Number` varchar(50) NOT NULL,
  `Date_Of_Birth` date NOT NULL,
  `Threshold_Normal_Low` float DEFAULT NULL,
  `Threshold_Normal_High` float DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `patient`
--

INSERT INTO `patient` (`Patient_ID`, `Healthcare_Number`, `Date_Of_Birth`, `Threshold_Normal_Low`, `Threshold_Normal_High`) VALUES
(1, 'HCN001', '1990-05-14', 70, 140),
(2, 'HCN002', '1988-03-22', 75, 130),
(3, 'HCN003', '1995-08-10', 80, 150),
(4, 'HCN004', '1979-11-01', 70, 160),
(5, 'HCN005', '2000-06-27', 80, 145);

-- --------------------------------------------------------

--
-- Table structure for table `report`
--

CREATE TABLE `report` (
  `Report_ID` int(11) NOT NULL,
  `Admin_ID` int(11) NOT NULL,
  `Period_Type` enum('Monthly','Yearly') NOT NULL,
  `Period_Start` date NOT NULL,
  `Period_End` date NOT NULL,
  `Generated_At` datetime DEFAULT current_timestamp(),
  `Summary_Data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`Summary_Data`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sessionmanager`
--

CREATE TABLE `sessionmanager` (
  `Session_ID` varchar(255) NOT NULL,
  `User_ID` int(11) NOT NULL,
  `Login_Time` datetime DEFAULT current_timestamp(),
  `Expiry_Time` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `specialist`
--

CREATE TABLE `specialist` (
  `Specialist_ID` int(11) NOT NULL,
  `Working_ID` varchar(50) NOT NULL,
  `Specialization` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `specialist`
--

INSERT INTO `specialist` (`Specialist_ID`, `Working_ID`, `Specialization`) VALUES
(6, 'SP001', 'Endocrinology'),
(7, 'SP002', 'Nutrition'),
(8, 'SP003', 'Internal Medicine');

-- --------------------------------------------------------

--
-- Table structure for table `specialist_patient_assignment`
--

CREATE TABLE `specialist_patient_assignment` (
  `Assignment_ID` int(11) NOT NULL,
  `Specialist_ID` int(11) NOT NULL,
  `Patient_ID` int(11) NOT NULL,
  `Assigned_At` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `specialist_patient_assignment`
--

INSERT INTO `specialist_patient_assignment` (`Assignment_ID`, `Specialist_ID`, `Patient_ID`, `Assigned_At`) VALUES
(1, 6, 1, '2025-10-16 19:21:44'),
(2, 6, 2, '2025-10-16 19:21:44'),
(3, 7, 3, '2025-10-16 19:21:44'),
(4, 8, 4, '2025-10-16 19:21:44'),
(5, 7, 5, '2025-10-16 19:21:44');

-- --------------------------------------------------------

--
-- Table structure for table `sugar_reading`
--

CREATE TABLE `sugar_reading` (
  `Reading_ID` int(11) NOT NULL,
  `Patient_ID` int(11) NOT NULL,
  `DateTime` datetime NOT NULL,
  `Value` float NOT NULL,
  `Unit` varchar(20) DEFAULT 'mg/dL',
  `Food_Notes` text DEFAULT NULL,
  `Activity_Notes` text DEFAULT NULL,
  `Event` varchar(255) DEFAULT NULL,
  `Symptoms` text DEFAULT NULL,
  `Notes` text DEFAULT NULL,
  `Category` enum('Normal','Borderline','Abnormal') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sugar_reading`
--

INSERT INTO `sugar_reading` (`Reading_ID`, `Patient_ID`, `DateTime`, `Value`, `Unit`, `Food_Notes`, `Activity_Notes`, `Event`, `Symptoms`, `Notes`, `Category`) VALUES
(1, 1, '2025-10-01 08:00:00', 110.5, 'mg/dL', 'Before breakfast', 'Morning walk', 'Took insulin', 'None', 'Good control', 'Normal'),
(2, 1, '2025-10-02 20:00:00', 165.2, 'mg/dL', 'After dinner', 'Watching TV', 'Stress', 'Fatigue', 'Slightly elevated', 'Borderline'),
(3, 1, '2025-10-03 13:00:00', 145.8, 'mg/dL', 'After lunch', 'Work meeting', 'Forgot medication', 'Headache', 'Missed dose', 'Abnormal'),
(4, 1, '2025-10-04 07:30:00', 95, 'mg/dL', 'Fasting', 'Yoga', 'Exercise', 'None', 'Excellent fasting result', 'Normal'),
(5, 1, '2025-10-05 18:30:00', 172.5, 'mg/dL', 'After snacks', 'Movie night', 'Stress', 'Thirst', 'Elevated', 'Borderline'),
(6, 2, '2025-10-01 09:00:00', 120.3, 'mg/dL', 'After oatmeal', 'Walk to work', 'Took insulin', 'None', 'Stable', 'Normal'),
(7, 2, '2025-10-02 22:00:00', 190, 'mg/dL', 'Late dinner', 'No exercise', 'Forgot medication', 'Fatigue', 'High evening value', 'Abnormal'),
(8, 2, '2025-10-03 08:30:00', 105.2, 'mg/dL', 'Before breakfast', 'Yoga', 'Exercise', 'None', 'Good morning reading', 'Normal'),
(9, 2, '2025-10-04 13:00:00', 160.1, 'mg/dL', 'After pasta', 'Sitting long', 'Stress', 'Sweating', 'Post-meal spike', 'Borderline'),
(10, 2, '2025-10-05 18:00:00', 135.4, 'mg/dL', 'Before dinner', 'Stretching', 'Relaxed day', 'None', 'Good control', 'Normal'),
(11, 3, '2025-10-01 07:45:00', 118.6, 'mg/dL', 'Fasting', 'Morning jog', 'Exercise', 'None', 'Ideal range', 'Normal'),
(12, 3, '2025-10-02 12:30:00', 178.2, 'mg/dL', 'After lunch', 'Office work', 'Stress', 'Fatigue', 'Slightly high', 'Borderline'),
(13, 3, '2025-10-03 09:15:00', 100, 'mg/dL', 'Before breakfast', 'Meditation', 'Relaxed', 'None', 'Calm morning', 'Normal'),
(14, 3, '2025-10-04 15:00:00', 155.7, 'mg/dL', 'Snack time', 'Busy afternoon', 'Skipped medication', 'Thirst', 'Minor spike', 'Abnormal'),
(15, 3, '2025-10-05 21:00:00', 140.9, 'mg/dL', 'After dinner', 'TV time', 'Took insulin', 'None', 'Evening okay', 'Normal'),
(16, 4, '2025-10-01 08:10:00', 130, 'mg/dL', 'Before breakfast', 'Walk', 'Took insulin', 'None', 'Good fasting', 'Normal'),
(17, 4, '2025-10-02 11:45:00', 170.2, 'mg/dL', 'After brunch', 'Workload', 'Stress', 'Fatigue', 'Elevated', 'Borderline'),
(18, 4, '2025-10-03 20:30:00', 190.5, 'mg/dL', 'After dinner', 'Sitting long', 'Forgot medication', 'Thirst', 'High reading', 'Abnormal'),
(19, 4, '2025-10-04 07:00:00', 95.4, 'mg/dL', 'Fasting', 'Jogging', 'Exercise', 'None', 'Excellent control', 'Normal'),
(20, 4, '2025-10-05 17:30:00', 160.8, 'mg/dL', 'After snack', 'Watching news', 'Stress', 'Sweating', 'Post-snack rise', 'Borderline'),
(21, 5, '2025-10-01 09:00:00', 112.1, 'mg/dL', 'Before breakfast', 'Relaxed morning', 'Exercise', 'None', 'In range', 'Normal'),
(22, 5, '2025-10-02 13:30:00', 145.7, 'mg/dL', 'After lunch', 'Busy day', 'Stress', 'Headache', 'Slightly high', 'Borderline'),
(23, 5, '2025-10-03 19:00:00', 180, 'mg/dL', 'After pizza', 'Movie', 'Forgot medication', 'Thirst', 'High sugar', 'Abnormal'),
(24, 5, '2025-10-04 08:15:00', 99.4, 'mg/dL', 'Fasting', 'Yoga', 'Exercise', 'None', 'Excellent reading', 'Normal'),
(25, 5, '2025-10-05 21:45:00', 135.3, 'mg/dL', 'After dinner', 'Relaxed', 'Took insulin', 'None', 'Stable evening', 'Normal'),
(26, 1, '2025-10-06 08:00:00', 108.3, 'mg/dL', 'Before breakfast', 'Calm', 'Relaxed', 'None', 'In range', 'Normal'),
(27, 2, '2025-10-06 09:00:00', 160.2, 'mg/dL', 'After sandwich', 'Work stress', 'Stress', 'Fatigue', 'Slight rise', 'Borderline'),
(28, 3, '2025-10-06 20:00:00', 172.4, 'mg/dL', 'After dinner', 'No exercise', 'Forgot medication', 'Thirst', 'Elevated', 'Abnormal'),
(29, 4, '2025-10-06 07:30:00', 102.6, 'mg/dL', 'Fasting', 'Jogging', 'Exercise', 'None', 'Healthy', 'Normal'),
(30, 5, '2025-10-06 18:30:00', 155.9, 'mg/dL', 'After meal', 'Long work hours', 'Stress', 'Sweating', 'Slight spike', 'Borderline'),
(31, 1, '2025-10-07 14:00:00', 188.4, 'mg/dL', 'After heavy lunch', 'Office stress', 'Forgot medication', 'Thirst', 'Abnormal value', 'Abnormal'),
(32, 2, '2025-10-07 07:45:00', 95.6, 'mg/dL', 'Fasting', 'Meditation', 'Relaxed', 'None', 'Normal start', 'Normal'),
(33, 3, '2025-10-07 12:00:00', 158.2, 'mg/dL', 'After lunch', 'Sitting long', 'Stress', 'Fatigue', 'Mild spike', 'Borderline'),
(34, 4, '2025-10-07 21:30:00', 132.1, 'mg/dL', 'After dinner', 'Watching TV', 'Took insulin', 'None', 'Good end of day', 'Normal'),
(35, 5, '2025-10-07 08:00:00', 101.4, 'mg/dL', 'Before breakfast', 'Stretching', 'Exercise', 'None', 'Healthy control', 'Normal');

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `User_ID` int(11) NOT NULL,
  `Name` varchar(255) NOT NULL,
  `Email` varchar(255) NOT NULL,
  `Password_Hash` varchar(255) NOT NULL,
  `Phone` varchar(20) DEFAULT NULL,
  `Profile_Image` varchar(255) DEFAULT NULL,
  `Created_At` datetime DEFAULT current_timestamp(),
  `Status` varchar(50) DEFAULT 'Active',
  `Role` enum('Patient','Specialist','Clinic_Staff','Administrator') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`User_ID`, `Name`, `Email`, `Password_Hash`, `Phone`, `Profile_Image`, `Created_At`, `Status`, `Role`) VALUES
(1, 'Alice Wong', 'alice@gmail.com', 'hash1', '6041112222', 'alice.jpg', '2025-10-16 19:21:44', 'Active', 'Patient'),
(2, 'Ben Singh', 'ben@gmail.com', 'hash2', '6042223333', 'ben.jpg', '2025-10-16 19:21:44', 'Active', 'Patient'),
(3, 'Clara Diaz', 'clara@gmail.com', 'hash3', '6043334444', 'clara.jpg', '2025-10-16 19:21:44', 'Active', 'Patient'),
(4, 'David Patel', 'david@gmail.com', 'hash4', '6044445555', 'david.jpg', '2025-10-16 19:21:44', 'Active', 'Patient'),
(5, 'Emma Johnson', 'emma@gmail.com', 'hash5', '6045556666', 'emma.jpg', '2025-10-16 19:21:44', 'Active', 'Patient'),
(6, 'Dr. Liam Brown', 'liam.brown@clinic.ca', 'hash6', '6046667777', 'liam.jpg', '2025-10-16 19:21:44', 'Active', 'Specialist'),
(7, 'Dr. Olivia Stone', 'olivia.stone@clinic.ca', 'hash7', '6047778888', 'olivia.jpg', '2025-10-16 19:21:44', 'Active', 'Specialist'),
(8, 'Dr. Noah Khan', 'noah.khan@clinic.ca', 'hash8', '6048889999', 'noah.jpg', '2025-10-16 19:21:44', 'Active', 'Specialist'),
(9, 'Sophia Lee', 'sophia.lee@clinic.ca', 'hash9', '6049990000', 'sophia.jpg', '2025-10-16 19:21:44', 'Active', 'Clinic_Staff'),
(10, 'Mason Clark', 'mason.clark@clinic.ca', 'hash10', '6041234567', 'mason.jpg', '2025-10-16 19:21:44', 'Active', 'Clinic_Staff'),
(11, 'Ava Roberts', 'ava.roberts@clinic.ca', 'hash11', '6049876543', 'ava.jpg', '2025-10-16 19:21:44', 'Active', 'Administrator');

--
-- Indexes for dumped tables
--

ALTER TABLE `administrator`
  ADD PRIMARY KEY (`Admin_ID`);

ALTER TABLE `aipatternanalyzer`
  ADD PRIMARY KEY (`Analysis_ID`),
  ADD KEY `Patient_ID` (`Patient_ID`);

ALTER TABLE `ai_suggestion`
  ADD PRIMARY KEY (`Suggestion_ID`),
  ADD KEY `Patient_ID` (`Patient_ID`);

ALTER TABLE `alert`
  ADD PRIMARY KEY (`Alert_ID`),
  ADD KEY `Patient_ID` (`Patient_ID`);

ALTER TABLE `categorythreshold`
  ADD PRIMARY KEY (`Threshold_ID`);

ALTER TABLE `clinic_staff`
  ADD PRIMARY KEY (`Staff_ID`);

ALTER TABLE `feedback`
  ADD PRIMARY KEY (`Feedback_ID`),
  ADD KEY `Specialist_ID` (`Specialist_ID`),
  ADD KEY `Patient_ID` (`Patient_ID`);

ALTER TABLE `patient`
  ADD PRIMARY KEY (`Patient_ID`),
  ADD UNIQUE KEY `Healthcare_Number` (`Healthcare_Number`);

ALTER TABLE `report`
  ADD PRIMARY KEY (`Report_ID`),
  ADD KEY `Admin_ID` (`Admin_ID`);

ALTER TABLE `sessionmanager`
  ADD PRIMARY KEY (`Session_ID`),
  ADD KEY `User_ID` (`User_ID`);

ALTER TABLE `specialist`
  ADD PRIMARY KEY (`Specialist_ID`);

ALTER TABLE `specialist_patient_assignment`
  ADD PRIMARY KEY (`Assignment_ID`),
  ADD KEY `Specialist_ID` (`Specialist_ID`),
  ADD KEY `Patient_ID` (`Patient_ID`);

ALTER TABLE `sugar_reading`
  ADD PRIMARY KEY (`Reading_ID`),
  ADD KEY `Patient_ID` (`Patient_ID`);

ALTER TABLE `user`
  ADD PRIMARY KEY (`User_ID`),
  ADD UNIQUE KEY `Email` (`Email`);

--
-- AUTO_INCREMENT for dumped tables
--

ALTER TABLE `aipatternanalyzer`
  MODIFY `Analysis_ID` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `ai_suggestion`
  MODIFY `Suggestion_ID` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `alert`
  MODIFY `Alert_ID` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `categorythreshold`
  MODIFY `Threshold_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

ALTER TABLE `feedback`
  MODIFY `Feedback_ID` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `report`
  MODIFY `Report_ID` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `specialist_patient_assignment`
  MODIFY `Assignment_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

ALTER TABLE `sugar_reading`
  MODIFY `Reading_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

ALTER TABLE `user`
  MODIFY `User_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- Constraints for dumped tables
--

ALTER TABLE `administrator`
  ADD CONSTRAINT `administrator_ibfk_1` FOREIGN KEY (`Admin_ID`) REFERENCES `user` (`User_ID`) ON DELETE CASCADE;

ALTER TABLE `aipatternanalyzer`
  ADD CONSTRAINT `aipatternanalyzer_ibfk_1` FOREIGN KEY (`Patient_ID`) REFERENCES `patient` (`Patient_ID`) ON DELETE CASCADE;

ALTER TABLE `ai_suggestion`
  ADD CONSTRAINT `ai_suggestion_ibfk_1` FOREIGN KEY (`Patient_ID`) REFERENCES `patient` (`Patient_ID`) ON DELETE CASCADE;

ALTER TABLE `alert`
  ADD CONSTRAINT `alert_ibfk_1` FOREIGN KEY (`Patient_ID`) REFERENCES `patient` (`Patient_ID`) ON DELETE CASCADE;

ALTER TABLE `clinic_staff`
  ADD CONSTRAINT `clinic_staff_ibfk_1` FOREIGN KEY (`Staff_ID`) REFERENCES `user` (`User_ID`) ON DELETE CASCADE;

ALTER TABLE `feedback`
  ADD CONSTRAINT `feedback_ibfk_1` FOREIGN KEY (`Specialist_ID`) REFERENCES `specialist` (`Specialist_ID`) ON DELETE CASCADE,
  ADD CONSTRAINT `feedback_ibfk_2` FOREIGN KEY (`Patient_ID`) REFERENCES `patient` (`Patient_ID`) ON DELETE CASCADE;

ALTER TABLE `patient`
  ADD CONSTRAINT `patient_ibfk_1` FOREIGN KEY (`Patient_ID`) REFERENCES `user` (`User_ID`) ON DELETE CASCADE;

ALTER TABLE `report`
  ADD CONSTRAINT `report_ibfk_1` FOREIGN KEY (`Admin_ID`) REFERENCES `administrator` (`Admin_ID`) ON DELETE CASCADE;

ALTER TABLE `sessionmanager`
  ADD CONSTRAINT `sessionmanager_ibfk_1` FOREIGN KEY (`User_ID`) REFERENCES `user` (`User_ID`) ON DELETE CASCADE;

ALTER TABLE `specialist`
  ADD CONSTRAINT `specialist_ibfk_1` FOREIGN KEY (`Specialist_ID`) REFERENCES `user` (`User_ID`) ON DELETE CASCADE;

ALTER TABLE `specialist_patient_assignment`
  ADD CONSTRAINT `specialist_patient_assignment_ibfk_1` FOREIGN KEY (`Specialist_ID`) REFERENCES `specialist` (`Specialist_ID`) ON DELETE CASCADE,
  ADD CONSTRAINT `specialist_patient_assignment_ibfk_2` FOREIGN KEY (`Patient_ID`) REFERENCES `patient` (`Patient_ID`) ON DELETE CASCADE;

ALTER TABLE `sugar_reading`
  ADD CONSTRAINT `sugar_reading_ibfk_1` FOREIGN KEY (`Patient_ID`) REFERENCES `patient` (`Patient_ID`) ON DELETE CASCADE;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;