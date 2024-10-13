import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.contrib.auth.hashers import make_password

def generate_userid(length=30):
    return str(uuid.uuid4())[:30]


class UserManager(BaseUserManager):
    def create_user(self,email, password=None,**extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        if not password:
            raise ValueError("The password field must be set")

        email = self.normalize_email(email)

        userid = generate_userid()
        user = self.model(email=email,userid=userid,**extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_admin(self, email, password=None,module_id=None,**extra_fields):
        user = self.create_user(email=email, password=password)
        admin = Admin.objects.create(
            userid=user,
            email=email,
            password=make_password(password),
            module_id=module_id,
            **extra_fields
        )

        return user, admin

class Users(AbstractBaseUser):
    userid = models.CharField(max_length=30, primary_key=True, editable=False)
    email = models.EmailField(max_length=50,unique=True)
    password = models.CharField(max_length=128)

    last_login=None

    USERID_FIELD = 'userid'
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return self.userid

class Module(models.Model):
    moduleid=models.CharField(max_length=30, primary_key=True)
    modulename = models.CharField(max_length=30)
    prompt = models.TextField(max_length=1000)
    voice = models.CharField(max_length=50)
    system_prompt = models.TextField(max_length=1000)
    case_abstract = models.TextField(max_length=200)
    file = models.TextField(max_length=200, null=True, blank=True)
    model = models.CharField(max_length=50)

    def __str__(self):
        return self.moduleid

class Admin(models.Model):
    adminid=models.CharField(max_length=30, primary_key=True, editable=False, default=generate_userid)
    userid = models.ForeignKey(Users, on_delete=models.CASCADE, null=True,blank=True)
    moduleid = models.ForeignKey(Module, on_delete=models.CASCADE, null=True, blank=True)
    email = models.EmailField(max_length=50)
    password = models.CharField(max_length=128)

    def __str__(self):
        return f"Admin: {self.adminid}"

class Interview(models.Model):
    interviewid = models.AutoField(primary_key=True)
    userid = models.ForeignKey(Users, on_delete=models.CASCADE)
    moduleid = models.ForeignKey(Module, on_delete=models.CASCADE)
    dateactive = models.DateTimeField()
    interviewlength = models.DurationField()
    transcript = models.TextField()
    def __str__(self):
        return f"Interview {self.interviewid}"
