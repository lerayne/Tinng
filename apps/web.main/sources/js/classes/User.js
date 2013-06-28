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

        if (this.id <= 0) return false;

        switch (rightName){

            case 'writeToTopic':
                return true;
            break;

            case 'createTopic':
                return true;
            break;

            case 'editMessage':
                var message = value;
                if (this.id == 1 || this.id == message.data.author_id) return true;
            break;
        }
    }

}

tinng.user = new tinng.protos.User(userID);
