<!DOCTYPE HTML>
<html>
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">

		<title><? template_title() ?></title>
		
		<? template_head() ?>
</head>

	<body>
		
		<!-- затемнение и блок поверх -->
		<div id="curtain"<?= $message ? '' : ' class="none"' ?>></div>
		<div id="over_curtain"<?= $message ? '' : ' class="none"' ?>>
			<div class="window">
				<div class="caption">
					<div class="title left">
						<?= $message ? $txt['title_message'] : '' ?>
					</div>
					<div class="close_btn right pointer"></div>
					<div class="clearboth"></div>
				</div>
				<div class="contents">
					<?= $message ? $txtp['ret_message_'.($message*1)] : '' ?>
				</div>
			</div>
		</div>

		<!-- верхняя панель -->
		<div id="top_bar">
			<div id="logo"><a href="/"><img src="skins/<?= $cfg['skin'] ?>/images/stock/logo_tiny.png "></a> 0.3 alpha</div>
			<div class="left"></div>
			<div class="right state_ind"></div>
			<div id="user_panel"><? require $device_path.'template_login.php'; ?></div>
			<div class="right">
				<div class="button" id="debug_toggle"><span>Тех.Инфо</span></div>
			</div>
			<div class="clearboth"></div>
		</div>
		
		<!-- основной блок -->
		<div id="app_area" class="invis">

			<table id="app_block" border="0" cellpadding="0" cellspacing="0">
				<tr id="app_block_tr">

					<? foreach ($columns as $key => $val): ?>

					<td class="global_column shadow resizeable" id="viewport_<?= $val ?>">
						<div class="column_inner">
							<div class="chrome caption">
								<div class="titlebar"><?= $txt['header_'.$val] ?></div>
								<div class="toolbar"></div>
							</div>
							<div>
								<div class="contents"></div>
							</div>
							<div class="chrome typing_panel"></div>
							<div class="chrome statusbar"></div>
						</div>
					</td>

					<? endforeach; ?>

				</tr>
			</table>

		</div>
		
		<!-- консоль -->
		<div id="debug_console" class="none">
			<table width="100%" cellpadding="0" cellspacing="0" border="0">
			<tr>
				<td valign="top"><div id='debug0'></div></td>
				<td valign="top"><div id='debug1'></div></td>
				<td valign="top"><div id='debug2'></div></td>
			</tr>
			</table>
		</div>
		
		
	</body>
</html>