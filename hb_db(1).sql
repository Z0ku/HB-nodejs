-- phpMyAdmin SQL Dump
-- version 4.5.2
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Mar 09, 2017 at 03:33 AM
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
(1, 1, 'Albums', 'My Album collection.', '2017-03-04 00:03:14'),
(2, 2, 'My Manga', 'MANGA!!!', '2017-03-04 11:03:45');

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
(2, 2, 'Jojo''s Bizzare Adventure Part 1: Phantom Blood', 'Manga', 'Jonathan Joestar', 'Acceptable', 1, 'Trading', 50.36, '2017-03-04 11:09:16', 'Active'),
(3, 2, 'Jojo''s Bizzare Adventure Part 2: Battle Tendency', 'Manga', 'Joseph Joestar', 'Mint', 1, 'Trading', 75.25, '2017-03-04 14:39:18', 'Active'),
(4, 1, 'Blood On the Tracks', 'Album', '2nd Best Album', 'Mint', 1, 'Not Trading', 0, '2017-03-04 23:33:01', 'Active'),
(5, 2, 'Berserk Vol.1', 'Manga', 'Kentaro Miura''s classic.', 'Mint', 2, 'Trading', 120.43, '2017-03-05 23:58:00', 'Active'),
(6, 2, 'Jojo''s Bizzare Adventure Part 3: Stardust Crusaders', 'Manga', 'Jotaro Kujo', 'Good', 2, 'Trading', 43.52, '2017-03-06 19:52:47', 'Active'),
(7, 1, 'Highway 61 Revisited', 'Album', '', 'Acceptable', 1, 'Trading', 600.65, '2017-03-06 22:14:50', 'Active');

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
('RBXS76DojQ9iFBBBxLAX5ylR0nnoi6yQ', 1489069213, '{"cookie":{"originalMaxAge":null,"expires":null,"httpOnly":true,"path":"/"},"loginUser":"riz","loginUserId":2}'),
('y-8AZmC3dG1A27bh0VGFVcCz2ho8SVrN', 1489112994, '{"cookie":{"originalMaxAge":null,"expires":null,"httpOnly":true,"path":"/"},"loginUser":"bob","loginUserId":1}');

-- --------------------------------------------------------

--
-- Table structure for table `tradeItems`
--

CREATE TABLE `tradeItems` (
  `item_id` int(11) NOT NULL,
  `itemQuant` int(11) NOT NULL,
  `trade_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `tradeItems`
--

INSERT INTO `tradeItems` (`item_id`, `itemQuant`, `trade_id`) VALUES
(1, 1, 2),
(2, 1, 3),
(3, 1, 3);

-- --------------------------------------------------------

--
-- Table structure for table `trades`
--

CREATE TABLE `trades` (
  `trade_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `tradeQuantity` int(11) NOT NULL,
  `tradeStatus` enum('Offer','Declined','Completed','Currently Trading') NOT NULL,
  `priceOffer` float DEFAULT NULL,
  `tradeDesc` text
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `trades`
--

INSERT INTO `trades` (`trade_id`, `item_id`, `user_id`, `tradeQuantity`, `tradeStatus`, `priceOffer`, `tradeDesc`) VALUES
(2, 3, 1, 1, 'Offer', 50.45, 'Giff me JOJO!!'),
(3, 1, 2, 1, 'Offer', 250.43, 'Jojo for Dylan');

-- --------------------------------------------------------

--
-- Table structure for table `tradingStatus`
--

CREATE TABLE `tradingStatus` (
  `trade_id` int(11) NOT NULL,
  `owner_id` int(11) NOT NULL,
  `trader_id` int(11) NOT NULL,
  `ownerStatus` enum('Not Received','Received') NOT NULL,
  `traderStatus` enum('Not Received','Received') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

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
-- Indexes for table `trades`
--
ALTER TABLE `trades`
  ADD PRIMARY KEY (`trade_id`);

--
-- Indexes for table `tradingStatus`
--
ALTER TABLE `tradingStatus`
  ADD PRIMARY KEY (`trade_id`);

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
  MODIFY `item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;
--
-- AUTO_INCREMENT for table `trades`
--
ALTER TABLE `trades`
  MODIFY `trade_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
