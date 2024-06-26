USE [master]
GO
/****** Object:  Database [CBS Database]    Script Date: 5/9/2024 7:37:09 PM ******/
CREATE DATABASE [CBS Database]
GO
IF (1 = FULLTEXTSERVICEPROPERTY('IsFullTextInstalled'))
begin
EXEC [CBS Database].[dbo].[sp_fulltext_database] @action = 'enable'
end
GO
ALTER DATABASE [CBS Database] SET ANSI_NULL_DEFAULT OFF 
GO
ALTER DATABASE [CBS Database] SET ANSI_NULLS OFF 
GO
ALTER DATABASE [CBS Database] SET ANSI_PADDING OFF 
GO
ALTER DATABASE [CBS Database] SET ANSI_WARNINGS OFF 
GO
ALTER DATABASE [CBS Database] SET ARITHABORT OFF 
GO
ALTER DATABASE [CBS Database] SET AUTO_CLOSE OFF 
GO
ALTER DATABASE [CBS Database] SET AUTO_SHRINK OFF 
GO
ALTER DATABASE [CBS Database] SET AUTO_UPDATE_STATISTICS ON 
GO
ALTER DATABASE [CBS Database] SET CURSOR_CLOSE_ON_COMMIT OFF 
GO
ALTER DATABASE [CBS Database] SET CURSOR_DEFAULT  GLOBAL 
GO
ALTER DATABASE [CBS Database] SET CONCAT_NULL_YIELDS_NULL OFF 
GO
ALTER DATABASE [CBS Database] SET NUMERIC_ROUNDABORT OFF 
GO
ALTER DATABASE [CBS Database] SET QUOTED_IDENTIFIER OFF 
GO
ALTER DATABASE [CBS Database] SET RECURSIVE_TRIGGERS OFF 
GO
ALTER DATABASE [CBS Database] SET  ENABLE_BROKER 
GO
ALTER DATABASE [CBS Database] SET AUTO_UPDATE_STATISTICS_ASYNC OFF 
GO
ALTER DATABASE [CBS Database] SET DATE_CORRELATION_OPTIMIZATION OFF 
GO
ALTER DATABASE [CBS Database] SET TRUSTWORTHY OFF 
GO
ALTER DATABASE [CBS Database] SET ALLOW_SNAPSHOT_ISOLATION ON 
GO
ALTER DATABASE [CBS Database] SET PARAMETERIZATION SIMPLE 
GO
ALTER DATABASE [CBS Database] SET READ_COMMITTED_SNAPSHOT ON 
GO
ALTER DATABASE [CBS Database] SET HONOR_BROKER_PRIORITY OFF 
GO
ALTER DATABASE [CBS Database] SET RECOVERY FULL 
GO
ALTER DATABASE [CBS Database] SET  MULTI_USER 
GO
ALTER DATABASE [CBS Database] SET PAGE_VERIFY CHECKSUM  
GO
ALTER DATABASE [CBS Database] SET DB_CHAINING OFF 
GO
USE [CBS Database]
GO
/****** Object:  Table [dbo].[ActivityTracker]    Script Date: 5/9/2024 7:37:09 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
SET ANSI_PADDING ON
GO
CREATE TABLE [dbo].[ActivityTracker](
	[UserID] [int] NULL,
	[Activitytype] [varchar](255) NULL,
	[Caloriesburned] [decimal](10, 2) NULL,
	[Time] [datetime] NULL,
	[ActivityID] [int] IDENTITY(1,1) NOT NULL,
 CONSTRAINT [PK_ActivityID] PRIMARY KEY CLUSTERED 
(
	[ActivityID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)
)

GO
SET ANSI_PADDING OFF
GO
/****** Object:  Table [dbo].[DailyNutri]    Script Date: 5/9/2024 7:37:11 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[DailyNutri](
	[UserID] [int] NULL,
	[Time] [datetime] NULL,
	[Energyintake] [decimal](10, 2) NULL,
	[Waterintake] [decimal](10, 2) NULL,
	[Caloriesburned] [decimal](10, 2) NULL,
	[Caloriebalance] [decimal](10, 2) NULL,
	[RecordID] [int] IDENTITY(1,1) NOT NULL,
 CONSTRAINT [PK_RecordID] PRIMARY KEY CLUSTERED 
(
	[RecordID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)
)

GO
/****** Object:  Table [dbo].[Ingredients]    Script Date: 5/9/2024 7:37:11 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
SET ANSI_PADDING ON
GO
CREATE TABLE [dbo].[Ingredients](
	[Name] [varchar](255) NULL,
	[Energy] [decimal](10, 2) NULL,
	[Protein] [decimal](10, 2) NULL,
	[Fat] [decimal](10, 2) NULL,
	[Fiber] [decimal](10, 2) NULL,
	[Carbohydrates] [decimal](10, 2) NULL,
	[IngredientsID] [int] IDENTITY(1,1) NOT NULL,
 CONSTRAINT [PK_TempID] PRIMARY KEY CLUSTERED 
(
	[IngredientsID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)
)

GO
SET ANSI_PADDING OFF
GO
/****** Object:  Table [dbo].[Meal]    Script Date: 5/9/2024 7:37:11 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
SET ANSI_PADDING ON
GO
CREATE TABLE [dbo].[Meal](
	[UserID] [int] NULL,
	[Mealname] [varchar](255) NULL,
	[MealID] [int] IDENTITY(1,1) NOT NULL,
	[MealAmount] [decimal](10, 2) NOT NULL,
 CONSTRAINT [MealID] PRIMARY KEY CLUSTERED 
(
	[MealID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)
)

GO
SET ANSI_PADDING OFF
GO
/****** Object:  Table [dbo].[MealIngredients]    Script Date: 5/9/2024 7:37:12 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[MealIngredients](
	[MealIngredientsID] [int] IDENTITY(1,1) NOT NULL,
	[MealID] [int] NOT NULL,
	[IngredientsID] [int] NOT NULL,
	[IngredientsAmount] [decimal](10, 2) NULL,
 CONSTRAINT [PK_MealIngredients] PRIMARY KEY CLUSTERED 
(
	[MealIngredientsID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)
)

GO
/****** Object:  Table [dbo].[User]    Script Date: 5/9/2024 7:37:12 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
SET ANSI_PADDING ON
GO
CREATE TABLE [dbo].[User](
	[UserID] [int] IDENTITY(1,1) NOT NULL,
	[Username] [varchar](255) NULL,
	[Password] [varchar](255) NULL,
	[Email] [varchar](255) NULL,
	[Weight] [decimal](10, 2) NULL,
	[Age] [int] NULL,
	[Sex] [char](1) NULL,
PRIMARY KEY CLUSTERED 
(
	[UserID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)
)

GO
SET ANSI_PADDING OFF
GO
ALTER TABLE [dbo].[ActivityTracker]  WITH CHECK ADD  CONSTRAINT [FK_ActivityT_Bruge_6603655] FOREIGN KEY([UserID])
REFERENCES [dbo].[User] ([UserID])
GO
ALTER TABLE [dbo].[ActivityTracker] CHECK CONSTRAINT [FK_ActivityT_Bruge_6603655]
GO
ALTER TABLE [dbo].[DailyNutri]  WITH CHECK ADD  CONSTRAINT [FK_DailyNutr__Bruge_693CA210] FOREIGN KEY([UserID])
REFERENCES [dbo].[User] ([UserID])
GO
ALTER TABLE [dbo].[DailyNutri] CHECK CONSTRAINT [FK_DailyNutr__Bruge_693CA210]
GO
ALTER TABLE [dbo].[Meal]  WITH CHECK ADD  CONSTRAINT [FK_Måltid_BrugerID_5EBF139D] FOREIGN KEY([UserID])
REFERENCES [dbo].[User] ([UserID])
GO
ALTER TABLE [dbo].[Meal] CHECK CONSTRAINT [FK_Måltid_BrugerID_5EBF139D]
GO
ALTER TABLE [dbo].[MealIngredients]  WITH CHECK ADD  CONSTRAINT [FK_MealTracker_Ingredients] FOREIGN KEY([IngredientsID])
REFERENCES [dbo].[Ingredients] ([IngredientsID])
GO
ALTER TABLE [dbo].[MealIngredients] CHECK CONSTRAINT [FK_MealTracker_Ingredients]
GO
ALTER TABLE [dbo].[MealIngredients]  WITH CHECK ADD  CONSTRAINT [FK_MealTracker_Meal] FOREIGN KEY([MealID])
REFERENCES [dbo].[Meal] ([MealID])
GO
ALTER TABLE [dbo].[MealIngredients] CHECK CONSTRAINT [FK_MealTracker_Meal]
GO
USE [master]
GO
ALTER DATABASE [CBS Database] SET  READ_WRITE 
GO
