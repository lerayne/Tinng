/**
 * Created with JetBrains PhpStorm.
 * User: Lerayne
 * Date: 28.06.13
 * Time: 16:42
 * To change this template use File | Settings | File Templates.
 */

tinng.protos.User = function(userID){

    this.id = userID;

}

tinng.protos.User.prototype = {

    hasRight:function(rightName, value){

		// неавторизованный пользователь не имеет никаких прав
        if (this.id <= 0) return false;

        switch (rightName){

            case 'writeToTopic':
				if (this.id > 0) return true;
            break;

            case 'createTopic':
				if (this.id > 0) return true;
            break;

            case 'editMessage':
                var message = value;
                if (this.id == 1 || this.id == message.data.author_id) return true;
            break;
        }

		// по умолчанию - отказать
		return false;
    }

}

tinng.user = new tinng.protos.User(userID);
