-- phpMyAdmin SQL Dump
-- version 4.5.2
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Mar 04, 2017 at 11:55 AM
-- Server version: 10.1.19-MariaDB
-- PHP Version: 7.0.9

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `hb_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `collections`
--

CREATE TABLE `collections` (
  `coll_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `collName` varchar(100) CHARACTER SET latin1 COLLATE latin1_bin NOT NULL,
  `collDesc` text,
  `dateStarted` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `collections`
--

INSERT INTO `collections` (`coll_id`, `user_id`, `collName`, `collDesc`, `dateStarted`) VALUES
(1, 1, 'Albums', 'My Album collection.\r\n\r\nActually it''s just a bunch of Dylan records.', '2017-03-04 00:03:14'),
(2, 2, 'My Manga', 'WWWWWRRRRRRYYYYY!!!', '2017-03-04 11:03:45');

--
-- Triggers `collections`
--
DELIMITER $$
CREATE TRIGGER `currDateTimeColl` BEFORE INSERT ON `collections` FOR EACH ROW SET NEW.dateStarted = NOW()
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `items`
--

CREATE TABLE `items` (
  `item_id` int(11) NOT NULL,
  `coll_id` int(11) NOT NULL,
  `itemName` varchar(100) CHARACTER SET latin1 COLLATE latin1_bin NOT NULL,
  `itemType` varchar(150) NOT NULL,
  `itemDesc` text,
  `itemCondition` enum('Good','Mint','Acceptable','Worn') NOT NULL,
  `quantity` int(11) NOT NULL,
  `tradeStatus` enum('Trading','Not Trading') NOT NULL,
  `tradePrice` float DEFAULT NULL,
  `dateAdded` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `itemStatus` enum('Active','Deleted') NOT NULL DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `items`
--

INSERT INTO `items` (`item_id`, `coll_id`, `itemName`, `itemType`, `itemDesc`, `itemCondition`, `quantity`, `tradeStatus`, `tradePrice`, `dateAdded`, `itemStatus`) VALUES
(1, 1, 'Blonde on Blonde', 'Album', 'Dylan''s best album', 'Good', 1, 'Trading', 3000.5, '2017-03-04 00:04:37', 'Active'),
(2, 2, 'Jojos Bizzare Adventure Part 1: Phantom Blood', 'Manga', 'Jonathan Joestar', 'Acceptable', 1, 'Trading', 50.36, '2017-03-04 11:09:16', 'Active'),
(3, 2, 'Jojos Bizzare Adventure Part 2: Battle Tendency', 'Manga', 'Joseph Joestar', 'Mint', 1, 'Trading', 75.25, '2017-03-04 14:39:18', 'Active');

--
-- Triggers `items`
--
DELIMITER $$
CREATE TRIGGER `currDateTime` BEFORE INSERT ON `items` FOR EACH ROW SET NEW.dateAdded = NOW()
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int(11) UNSIGNED NOT NULL,
  `data` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `sessions`
--

INSERT INTO `sessions` (`session_id`, `expires`, `data`) VALUES
('PEzeGsiib3yoCcBQNL1SZnUq4E1zZXHE', 1488695725, '{"cookie":{"originalMaxAge":null,"expires":null,"httpOnly":true,"path":"/"},"loginUser":"riz","loginUserId":2}'),
('QePT7Jf-lpRweRVaMmVjiID8rQdIQEhV', 1488698436, '{"cookie":{"originalMaxAge":null,"expires":null,"httpOnly":true,"path":"/"},"loginUser":"riz","loginUserId":2}'),
('lXCJ1gKWXMAWaBeUQevsjK0nI64nHm56', 1488695725, '{"cookie":{"originalMaxAge":null,"expires":null,"httpOnly":true,"path":"/"},"loginUser":"riz","loginUserId":2}'),
('uu1oDV3Vxh-vQzFDHjsT5GCCuejoFo-b', 1488695725, '{"cookie":{"originalMaxAge":null,"expires":null,"httpOnly":true,"path":"/"},"loginUser":"riz","loginUserId":2}'),
('ze3-Nb6f47AODx1X1iHN97lrKXdXdf65', 1488711182, '{"cookie":{"originalMaxAge":null,"expires":null,"httpOnly":true,"path":"/"},"loginUser":"riz","loginUserId":2}');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `username` varchar(100) CHARACTER SET latin1 COLLATE latin1_bin NOT NULL,
  `password` varchar(40) NOT NULL,
  `email` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `username`, `password`, `email`) VALUES
(1, 'bob', '4f97319b308ed6bd3f0c195c176bbd77', 'bob_dylan@gmail.com'),
(2, 'riz', '9f05aa4202e4ce8d6a72511dc735cce9', 'rizaller.amolo@gmail.com');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `collections`
--
ALTER TABLE `collections`
  ADD PRIMARY KEY (`coll_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `collName` (`collName`);

--
-- Indexes for table `items`
--
ALTER TABLE `items`
  ADD PRIMARY KEY (`item_id`),
  ADD KEY `coll_id` (`coll_id`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`session_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `collections`
--
ALTER TABLE `collections`
  MODIFY `coll_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
--
-- AUTO_INCREMENT for table `items`
--
ALTER TABLE `items`
  MODIFY `item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
