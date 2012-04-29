<!DOCTYPE HTML>
<html>
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">

		<title><? template_title() ?></title>
		
		<? template_head() ?>
	</head>
	
	<body>
		<div id="tinng-main">

			<div id="dialogue-wrapper">
				<div id="curtain"></div>
				<div id="dialogue"></div>
			</div>
			
			<header id="tinng-main-header">
				<a class='logo' href='/'><img src="<?= path('/images/stock/logo_tiny.png') ?>"></a>
				<div class='right state-ind'></div>
				<div class='right'>
					<? require $device_path.'template_login.php'; ?>
				</div>
				<div class='clearfix'></div>
			</header>

			<div id="tinng-units-area">
			<!-- сюда пишутся юниты -->
			</div>
			
			<footer id="tinng-main-footer">
				
			</footer>
		
		</div>

		<div id="tinng-chunks">

			<div data-chunk-name="unit" class="unit">
				<header></header>
				<div class="scroll-area"></div>
				<footer></footer>
			</div>

			<div data-chunk-name="topic" class="letter topic">

			</div>

		</div>
	</body>
</html>